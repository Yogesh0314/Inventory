const express = require('express');
const { getTransactions, createTransaction } = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { transactionSchema } = require('../middleware/validationSchemas');

const router = express.Router();

router.route('/')
  .get(protect, getTransactions)
  .post(protect, validate(transactionSchema), createTransaction);

module.exports = router;
