const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff'], default: 'staff' }
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  description: { type: String },
  category: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 0 },
  minLimit: { type: Number, default: 5 },
  supplierId: { type: String }, // Holds the _id of the supplier
  imageUrl: { type: String }
}, { timestamps: true });

// Performance Indexes
ProductSchema.index({ sku: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ name: 'text', sku: 'text', category: 'text' });

const SupplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactName: { type: String },
  email: { type: String },
  phone: { type: String },
  address: { type: String }
}, { timestamps: true });

const TransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['purchase', 'sale'], required: true },
  productId: { type: String, required: true },
  productName: { type: String }, // cached for easier display
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }, // unit price at transaction time
  notes: { type: String },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

// Performance Indexes
TransactionSchema.index({ date: -1 });
TransactionSchema.index({ productId: 1 });

const AuditLogSchema = new mongoose.Schema({
  user: {
    id: { type: String, required: true },
    username: { type: String, required: true },
    role: { type: String, required: true }
  },
  action: { type: String, required: true }, // e.g., 'CREATE', 'UPDATE', 'DELETE'
  target: {
    collection: { type: String, required: true }, // e.g., 'products', 'suppliers'
    id: { type: String },
    name: { type: String }
  },
  oldValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ 'user.username': 1 });

module.exports = {
  UserSchema,
  ProductSchema,
  SupplierSchema,
  TransactionSchema,
  AuditLogSchema
};
