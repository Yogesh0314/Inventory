const express = require('express');
const { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  adjustStock,
  importProducts
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { productSchema } = require('../middleware/validationSchemas');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

router.route('/')
  .get(protect, getProducts)
  .post(protect, validate(productSchema), createProduct);

router.post('/import', protect, adminOnly, upload.single('file'), importProducts);

router.route('/:id')
  .get(protect, getProductById)
  .put(protect, validate(productSchema.partial()), updateProduct)
  .delete(protect, adminOnly, deleteProduct);

router.post('/:id/adjust-stock', protect, adjustStock);

module.exports = router;
