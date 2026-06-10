const express = require('express');
const { 
  getSuppliers, 
  getSupplierById, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier 
} = require('../controllers/supplierController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { supplierSchema } = require('../middleware/validationSchemas');

const router = express.Router();

router.route('/')
  .get(protect, getSuppliers)
  .post(protect, validate(supplierSchema), createSupplier);

router.route('/:id')
  .get(protect, getSupplierById)
  .put(protect, validate(supplierSchema.partial()), updateSupplier)
  .delete(protect, adminOnly, deleteSupplier);

module.exports = router;
