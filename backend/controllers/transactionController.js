const { getModels } = require('../config/db');
const logger = require('../utils/logger');
const { logAudit } = require('../utils/auditLogger');
const { sendLowStockAlert } = require('../utils/emailService');

// @desc    Get all transactions (sorted by date descending)
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    const models = getModels();
    
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    let query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const allTransactions = await models.Transaction.find(query);
    
    // Sort transactions by date descending (latest first)
    allTransactions.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    
    const totalTransactions = allTransactions.length;
    const transactions = allTransactions.slice(skip, skip + take);

    return res.json({
      transactions,
      totalTransactions,
      totalPages: Math.ceil(totalTransactions / take),
      currentPage: Number(page)
    });
  } catch (error) {
    logger.error('Get Transactions Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Record a new transaction (purchase or sale) and auto-update stock levels
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res) => {
  try {
    const { type, productId, quantity, price, notes } = req.body;
    const models = getModels();

    const qty = Number(quantity);
    const prc = Number(price);

    // Verify product exists
    const product = await models.Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Calculate new stock quantity
    let newQuantity = product.quantity;
    if (type === 'purchase') {
      newQuantity += qty;
    } else if (type === 'sale') {
      if (product.quantity < qty) {
        return res.status(400).json({ 
          message: `Insufficient stock. Requested sale: ${qty}, Available stock: ${product.quantity}` 
        });
      }
      newQuantity -= qty;
    }

    // Create the transaction audit record
    const transaction = await models.Transaction.create({
      type,
      productId,
      productName: product.name,
      quantity: qty,
      price: prc,
      notes: notes || `Recorded ${type} transaction`,
      date: new Date()
    });

    // Automatically update the product's quantity in the database!
    const updatedProduct = await models.Product.findByIdAndUpdate(productId, {
      quantity: newQuantity
    }, { new: true });

    await logAudit(req, 'CREATE_TRANSACTION', 'transactions', transaction, null, transaction);

    // Trigger low stock alert if needed
    if (updatedProduct.quantity <= (updatedProduct.minLimit || 5)) {
      try {
        const admins = await models.User.find({ role: 'admin' });
        const adminEmails = admins.map(a => a.email).filter(Boolean);
        await sendLowStockAlert(updatedProduct, adminEmails);
      } catch (error) {
        logger.error('Low Stock Alert Trigger Error (Transaction):', error);
      }
    }

    logger.info(`Transaction recorded: ${type} of ${qty} units for product ${product.sku}`);
    return res.status(201).json(transaction);
  } catch (error) {
    logger.error('Create Transaction Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getTransactions,
  createTransaction
};
