const { getModels } = require('../config/db');
const logger = require('./logger');

/**
 * Logs an action to the AuditLog collection
 * @param {Object} req - Express request object (to get user info)
 * @param {String} action - CREATE, UPDATE, DELETE, etc.
 * @param {String} collection - products, suppliers, users, etc.
 * @param {Object} targetObj - The object being acted upon (to get ID and Name)
 * @param {Object} oldValue - Previous state (for UPDATE)
 * @param {Object} newValue - New state (for UPDATE/CREATE)
 */
const logAudit = async (req, action, collection, targetObj, oldValue = null, newValue = null) => {
  try {
    const models = getModels();
    
    const auditEntry = {
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role
      },
      action,
      target: {
        collection,
        id: targetObj._id || targetObj.id,
        name: targetObj.name || targetObj.username || 'N/A'
      },
      oldValue,
      newValue,
      timestamp: new Date()
    };

    await models.AuditLog.create(auditEntry);
  } catch (error) {
    logger.error('Failed to save audit log:', error);
  }
};

module.exports = { logAudit };
