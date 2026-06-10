const { getModels } = require('../config/db');
const logger = require('../utils/logger');
const { logAudit } = require('../utils/auditLogger');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
const getSuppliers = async (req, res) => {
  try {
    const models = getModels();
    const suppliers = await models.Supplier.find({});
    return res.json(suppliers);
  } catch (error) {
    logger.error('Get Suppliers Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Private
const getSupplierById = async (req, res) => {
  try {
    const models = getModels();
    const supplier = await models.Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    return res.json(supplier);
  } catch (error) {
    logger.error('Get Supplier By ID Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Create a supplier
// @route   POST /api/suppliers
// @access  Private
const createSupplier = async (req, res) => {
  try {
    const { name, contactName, email, phone, address } = req.body;
    const models = getModels();

    const supplier = await models.Supplier.create({
      name,
      contactName,
      email,
      phone,
      address
    });

    await logAudit(req, 'CREATE', 'suppliers', supplier, null, supplier);

    logger.info(`Supplier created: ${name}`);
    return res.status(201).json(supplier);
  } catch (error) {
    logger.error('Create Supplier Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Update a supplier
// @route   PUT /api/suppliers/:id
// @access  Private
const updateSupplier = async (req, res) => {
  try {
    const { name, contactName, email, phone, address } = req.body;
    const models = getModels();

    const supplier = await models.Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    const oldState = { ...supplier.toObject ? supplier.toObject() : supplier };

    const updatedSupplier = await models.Supplier.findByIdAndUpdate(req.params.id, {
      name: name || supplier.name,
      contactName: contactName !== undefined ? contactName : supplier.contactName,
      email: email !== undefined ? email : supplier.email,
      phone: phone !== undefined ? phone : supplier.phone,
      address: address !== undefined ? address : supplier.address
    }, { new: true });

    await logAudit(req, 'UPDATE', 'suppliers', updatedSupplier, oldState, updatedSupplier);

    logger.info(`Supplier updated: ${supplier.name}`);
    return res.json(updatedSupplier);
  } catch (error) {
    logger.error('Update Supplier Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Delete a supplier
// @route   DELETE /api/suppliers/:id
// @access  Private/Admin Only
const deleteSupplier = async (req, res) => {
  try {
    const models = getModels();
    const supplier = await models.Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    await logAudit(req, 'DELETE', 'suppliers', supplier, supplier, null);
    await models.Supplier.findByIdAndDelete(req.params.id);
    
    // Proactively clean up product supplier linkages
    const products = await models.Product.find({ supplierId: req.params.id });
    for (let product of products) {
      await models.Product.findByIdAndUpdate(product._id, { supplierId: null });
    }

    logger.info(`Supplier deleted and product linkages cleaned: ${supplier.name}`);
    return res.json({ message: 'Supplier removed and product linkages updated successfully' });
  } catch (error) {
    logger.error('Delete Supplier Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
