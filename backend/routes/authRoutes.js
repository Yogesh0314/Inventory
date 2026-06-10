const express = require('express');
const { 
  registerUser, 
  loginUser, 
  getMe, 
  getUsers, 
  updateUserRole, 
  deleteUser 
} = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../middleware/validationSchemas');

const router = express.Router();

// Public routes
router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);

// Private routes
router.get('/me', protect, getMe);

// Admin only routes
router.get('/users', protect, adminOnly, getUsers);
router.put('/users/:id/role', protect, adminOnly, updateUserRole);
router.delete('/users/:id', protect, adminOnly, deleteUser);

module.exports = router;
