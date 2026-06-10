const mongoose = require('mongoose');
const { UserSchema, ProductSchema, SupplierSchema, TransactionSchema, AuditLogSchema } = require('../models/schemas');
const fs = require('fs');
const path = require('path');

// Local JSON DB configuration
const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure directory and file exist for fallback
const initLocalDB = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
      users: [],
      products: [],
      suppliers: [],
      transactions: [],
      audit_logs: []
    }, null, 2));
  }
};

const readLocalDB = () => {
  try {
    initLocalDB();
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading local DB:', err);
    return { users: [], products: [], suppliers: [], transactions: [], audit_logs: [] };
  }
};

const writeLocalDB = (data) => {
  try {
    initLocalDB();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing to local DB:', err);
  }
};

// Generic JSON Database Model implementation mirroring mongoose CRUD methods
class JSONModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  async find(query = {}, options = {}) {
    const db = readLocalDB();
    let items = db[this.collectionName] || [];
    
    // Filtering logic
    let filteredItems = items.filter(item => {
      for (let key in query) {
        const queryVal = query[key];
        const itemVal = item[key];

        if (queryVal !== undefined) {
          if (typeof queryVal === 'object' && queryVal !== null) {
            // Handle Regex
            if (queryVal.$regex) {
              const regex = new RegExp(queryVal.$regex, queryVal.$options || 'i');
              if (!regex.test(itemVal || '')) return false;
            }
            // Handle Range Queries
            if (queryVal.$gte !== undefined) {
              if (new Date(itemVal) < new Date(queryVal.$gte)) return false;
            }
            if (queryVal.$lte !== undefined) {
              if (new Date(itemVal) > new Date(queryVal.$lte)) return false;
            }
            // Handle $or
            if (key === '$or' && Array.isArray(queryVal)) {
              const matched = queryVal.some(orQuery => {
                for (let orKey in orQuery) {
                  const orRegex = new RegExp(orQuery[orKey].$regex, orQuery[orKey].$options || 'i');
                  if (orRegex.test(item[orKey] || '')) return true;
                }
                return false;
              });
              if (!matched) return false;
            }
          } else if (itemVal !== queryVal) {
            return false;
          }
        }
      }
      return true;
    });

    // Sort by createdAt descending by default if no sort provided
    filteredItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination (Skip and Limit)
    const skip = options.skip || 0;
    const limit = options.limit || filteredItems.length;

    return filteredItems.slice(skip, skip + limit);
  }

  async findOne(query = {}) {
    const items = await this.find(query);
    return items[0] || null;
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async create(doc) {
    const db = readLocalDB();
    const newDoc = {
      _id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...doc
    };
    if (!db[this.collectionName]) db[this.collectionName] = [];
    db[this.collectionName].push(newDoc);
    writeLocalDB(db);
    return newDoc;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const db = readLocalDB();
    const items = db[this.collectionName] || [];
    const index = items.findIndex(item => item._id === id);
    if (index === -1) return null;

    let updatedItem = { ...items[index] };
    
    // Handle standard update or mongoose increment operations
    if (update.$inc) {
      for (let key in update.$inc) {
        updatedItem[key] = (Number(updatedItem[key]) || 0) + Number(update.$inc[key]);
      }
      delete update.$inc;
    }
    
    updatedItem = {
      ...updatedItem,
      ...update,
      updatedAt: new Date().toISOString()
    };
    
    items[index] = updatedItem;
    writeLocalDB(db);
    return updatedItem;
  }

  async findByIdAndDelete(id) {
    const db = readLocalDB();
    const items = db[this.collectionName] || [];
    const index = items.findIndex(item => item._id === id);
    if (index === -1) return null;
    
    const deleted = items.splice(index, 1)[0];
    writeLocalDB(db);
    return deleted;
  }

  async countDocuments(query = {}) {
    const items = await this.find(query);
    return items.length;
  }
}

// Database Connection & Exporting Models
let db = {};
let useMongoDB = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;
  if (mongoURI && mongoURI.trim() !== '') {
    try {
      console.log('🔄 Connecting to MongoDB...');
      await mongoose.connect(mongoURI);
      console.log('✅ MongoDB Connected successfully!');
      useMongoDB = true;
      
      db.User = mongoose.model('User', UserSchema);
      db.Product = mongoose.model('Product', ProductSchema);
      db.Supplier = mongoose.model('Supplier', SupplierSchema);
      db.Transaction = mongoose.model('Transaction', TransactionSchema);
      db.AuditLog = mongoose.model('AuditLog', AuditLogSchema);
      db.isFallback = false;
    } catch (err) {
      console.error(`❌ MongoDB connection failed: ${err.message}`);
      console.log('⚠️ Falling back to local JSON database storage...');
      setupFallbackDB();
    }
  } else {
    console.log('ℹ️ No MONGO_URI specified in environment config.');
    console.log('📂 Initializing local JSON database storage...');
    setupFallbackDB();
  }
};

const setupFallbackDB = () => {
  useMongoDB = false;
  initLocalDB();
  
  db.User = new JSONModel('users');
  db.Product = new JSONModel('products');
  db.Supplier = new JSONModel('suppliers');
  db.Transaction = new JSONModel('transactions');
  db.AuditLog = new JSONModel('audit_logs');
  db.isFallback = true;
  
  console.log('✅ Local JSON Database initialized at', DB_FILE);
};

// Instantly initialize DB reference before async connection finishes so server can require models
setupFallbackDB();

module.exports = {
  connectDB,
  getModels: () => db
};
