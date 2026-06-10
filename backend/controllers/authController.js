const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getModels } = require('../config/db');
const logger = require('../utils/logger');
const { logAudit } = require('../utils/auditLogger');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkey123_change_in_production', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const models = getModels();

    // Check if user already exists
    const userExists = await models.User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await models.User.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'staff'
    });

    if (user) {
      logger.info(`New user registered: ${email}`);
      return res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      return res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    logger.error('Register User Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Authenticate a user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const models = getModels();

    // Check for user email
    const user = await models.User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      logger.info(`User logged in: ${email}`);
      return res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      logger.warn(`Failed login attempt for email: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    logger.error('Login User Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    // req.user is populated by protect middleware
    return res.json(req.user);
  } catch (error) {
    logger.error('Get Me Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// --- Administrative User Management ---

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const models = getModels();
    const users = await models.User.find({});
    
    // Remove passwords before sending
    const usersWithoutPasswords = users.map(user => {
      // If it's a Mongoose document, convert to plain object; otherwise use as is
      const userObj = user.toObject ? user.toObject() : user;
      const { password, ...userWithoutPassword } = userObj;
      return userWithoutPassword;
    });
    
    return res.json(usersWithoutPasswords);
  } catch (error) {
    logger.error('Get Users Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Update user role
// @route   PUT /api/auth/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const models = getModels();

    if (!['admin', 'staff'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await models.User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from demoting themselves
    if (user._id === req.user.id && role !== 'admin') {
        return res.status(400).json({ message: 'You cannot demote yourself from Admin' });
    }

    const oldState = { role: user.role };
    const updatedUser = await models.User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    
    const userObj = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
    const { password, ...userWithoutPassword } = userObj;
    
    await logAudit(req, 'UPDATE_ROLE', 'users', user, oldState, { role });
    
    logger.info(`User role updated: ${user.email} to ${role}`);
    return res.json(userWithoutPassword);
  } catch (error) {
    logger.error('Update User Role Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// @desc    Delete user
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const models = getModels();
    const user = await models.User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id === req.user.id) {
        return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    await logAudit(req, 'DELETE', 'users', user, user, null);
    await models.User.findByIdAndDelete(req.params.id);
    
    logger.info(`User deleted: ${user.email}`);
    return res.json({ message: 'User removed successfully' });
  } catch (error) {
    logger.error('Delete User Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  getUsers,
  updateUserRole,
  deleteUser
};
