const jwt = require('jsonwebtoken');
const { getModels } = require('../config/db');
const logger = require('../utils/logger');

// Middleware to verify JWT token and authorize requests
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token from bearer header
      token = req.headers.authorization.split(' ')[1];

      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey123_change_in_production');

      // Fetch user from database
      const models = getModels();
      const user = await models.User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ message: 'User no longer exists or invalid session' });
      }

      // Attach user to req object without the password
      req.user = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      };

      next();
    } catch (error) {
      logger.error('JWT Verification Error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed verification' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// Middleware to restrict access to Admins only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Forbidden: Access restricted to Administrators only' });
  }
};

module.exports = {
  protect,
  adminOnly
};
