const { getModels } = require('../config/db');
const logger = require('../utils/logger');
const { logAudit } = require('../utils/auditLogger');
const { sendLowStockAlert } = require('../utils/emailService');

// Helper to trigger low stock email to all admins
const checkAndAlertLowStock = async (product) => {
  if (product.quantity <= (product.minLimit || 5)) {
    try {
      const models = getModels();
      const admins = await models.User.find({ role: 'admin' });
      const adminEmails = admins.map(a => a.email).filter(Boolean);
      await sendLowStockAlert(product, adminEmails);
    } catch (error) {
      logger.error('Low Stock Alert Trigger Error:', error);
    }
  }
};

// @desc    Get all products (with optional search/filtering)
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    const { search, category, lowStock, page = 1, limit = 10 } = req.query;
    const models = getModels();
    
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      // Handles simple regex for search across Name, SKU, or Category
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    let allFilteredProducts;
    if (models.isFallback) {
      allFilteredProducts = await models.Product.find(query);
      if (lowStock === 'true') {
        allFilteredProducts = allFilteredProducts.filter(p => p.quantity <= (p.minLimit || 5));
      }
    } else {
      // MongoDB optimized query
      let mongoQuery = { ...query };
      if (lowStock === 'true') {
        mongoQuery.$expr = { $lte: ['$quantity', { $ifNull: ['$minLimit', 5] }] };
      }
      allFilteredProducts = await models.Product.find(mongoQuery);
    }

    const totalProducts = allFilteredProducts.length;
    const products = allFilteredProducts.slice(skip, skip + take);
    
    return res.json({
      products,
      totalProducts,
      totalPages: Math.ceil(totalProducts / take),
      currentPage: Number(page)
    });
  } catch (error) {
    logger.error('Get Products Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res) => {
  try {
    const models = getModels();
    const product = await models.Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    return res.json(product);
  } catch (error) {
    logger.error('Get Product By ID Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res) => {
  try {
    const { name, sku, description, category, price, quantity, minLimit, supplierId, imageUrl } = req.body;
    const models = getModels();

    // Check SKU uniqueness
    const skuExists = await models.Product.findOne({ sku: sku.trim() });
    if (skuExists) {
      return res.status(400).json({ message: 'A product with this SKU already exists' });
    }

    const product = await models.Product.create({
      name,
      sku: sku.trim(),
      description,
      category,
      price: Number(price),
      quantity: Number(quantity) || 0,
      minLimit: minLimit !== undefined ? Number(minLimit) : 5,
      supplierId,
      imageUrl
    });

    await logAudit(req, 'CREATE', 'products', product, null, product);
    
    // Check for low stock alert
    await checkAndAlertLowStock(product);

    logger.info(`Product created: ${name} (SKU: ${sku})`);
    return res.status(201).json(product);
  } catch (error) {
    logger.error('Create Product Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res) => {
  try {
    const { name, sku, description, category, price, quantity, minLimit, supplierId, imageUrl } = req.body;
    const models = getModels();

    const product = await models.Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const oldState = { ...product.toObject ? product.toObject() : product };

    // Check SKU uniqueness if changing SKU
    if (sku && sku.trim() !== product.sku) {
      const skuExists = await models.Product.findOne({ sku: sku.trim() });
      if (skuExists) {
        return res.status(400).json({ message: 'A product with this SKU already exists' });
      }
    }

    const updatedProduct = await models.Product.findByIdAndUpdate(req.params.id, {
      name: name || product.name,
      sku: sku ? sku.trim() : product.sku,
      description: description !== undefined ? description : product.description,
      category: category !== undefined ? category : product.category,
      price: price !== undefined ? Number(price) : product.price,
      quantity: quantity !== undefined ? Number(quantity) : product.quantity,
      minLimit: minLimit !== undefined ? Number(minLimit) : product.minLimit,
      supplierId: supplierId !== undefined ? supplierId : product.supplierId,
      imageUrl: imageUrl !== undefined ? imageUrl : product.imageUrl
    }, { new: true });

    await logAudit(req, 'UPDATE', 'products', updatedProduct, oldState, updatedProduct);
    
    // Check for low stock alert
    await checkAndAlertLowStock(updatedProduct);

    logger.info(`Product updated: ${product.sku}`);
    return res.json(updatedProduct);
  } catch (error) {
    logger.error('Update Product Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin Only
const deleteProduct = async (req, res) => {
  try {
    const models = getModels();
    const product = await models.Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await logAudit(req, 'DELETE', 'products', product, product, null);
    await models.Product.findByIdAndDelete(req.params.id);
    
    logger.info(`Product deleted: ${product.sku}`);
    return res.json({ message: 'Product removed successfully' });
  } catch (error) {
    logger.error('Delete Product Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Adjust Product Stock quantity manually
// @route   POST /api/products/:id/adjust-stock
// @access  Private
const adjustStock = async (req, res) => {
  try {
    const { amount } = req.body; // Positive to add, negative to subtract
    const models = getModels();

    if (amount === undefined || isNaN(amount)) {
      return res.status(400).json({ message: 'Please provide a valid adjustment amount' });
    }

    const product = await models.Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const newQuantity = product.quantity + Number(amount);
    if (newQuantity < 0) {
      return res.status(400).json({ message: 'Insufficient stock. Quantity cannot go below 0' });
    }

    const updatedProduct = await models.Product.findByIdAndUpdate(req.params.id, {
      quantity: newQuantity
    }, { new: true });

    await logAudit(req, 'ADJUST_STOCK', 'products', updatedProduct, { quantity: product.quantity }, { quantity: newQuantity });
    
    // Check for low stock
    await checkAndAlertLowStock(updatedProduct);

    // Also log this as a transaction audit record for perfect inventory tracking!
    await models.Transaction.create({
      type: amount > 0 ? 'purchase' : 'sale',
      productId: product._id,
      productName: product.name,
      quantity: Math.abs(amount),
      price: product.price,
      notes: `Manual stock adjustment by ${req.user.username}`
    });

    logger.info(`Stock adjusted for ${product.sku}: ${amount} units`);
    return res.json(updatedProduct);
  } catch (error) {
    logger.error('Adjust Stock Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const fs = require('fs');
const csv = require('csv-parser');

// @desc    Import products from CSV
// @route   POST /api/products/import
// @access  Private/Admin
const importProducts = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a CSV file' });
  }

  const results = [];
  const errors = [];
  const filePath = req.file.path;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        const models = getModels();
        let importedCount = 0;

        for (const item of results) {
          try {
            // Basic validation
            if (!item.name || !item.sku || !item.price) {
              errors.push(`Row missing required fields: ${JSON.stringify(item)}`);
              continue;
            }

            // Check uniqueness
            const exists = await models.Product.findOne({ sku: item.sku.trim() });
            if (exists) {
              errors.push(`SKU ${item.sku} already exists, skipping.`);
              continue;
            }

            const product = await models.Product.create({
              name: item.name,
              sku: item.sku.trim(),
              description: item.description || '',
              category: item.category || '',
              price: Number(item.price),
              quantity: Number(item.quantity) || 0,
              minLimit: Number(item.minLimit) || 5,
              imageUrl: item.imageUrl || ''
            });

            await logAudit(req, 'IMPORT', 'products', product, null, product);
            importedCount++;
          } catch (err) {
            errors.push(`Error importing SKU ${item.sku || 'unknown'}: ${err.message}`);
          }
        }

        // Clean up file
        fs.unlinkSync(filePath);

        return res.json({
          message: `Import complete. Successfully imported ${importedCount} items.`,
          errors: errors.length > 0 ? errors : null
        });
      } catch (err) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        logger.error('Bulk Import Error:', err);
        return res.status(500).json({ message: 'Internal Server Error during import' });
      }
    });
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  importProducts
};
