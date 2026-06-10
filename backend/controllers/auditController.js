const { getModels } = require('../config/db');
const logger = require('../utils/logger');

// @desc    Get system audit logs
// @route   GET /api/audit
// @access  Private/Admin
const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const models = getModels();
    
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    let query = {};
    if (search) {
      query.$or = [
        { 'user.username': { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { 'target.name': { $regex: search, $options: 'i' } },
        { 'target.collection': { $regex: search, $options: 'i' } }
      ];
    }

    const allLogs = await models.AuditLog.find(query);
    // Sort by timestamp descending
    allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const totalLogs = allLogs.length;
    const logs = allLogs.slice(skip, skip + take);

    return res.json({
      logs,
      totalLogs,
      totalPages: Math.ceil(totalLogs / take),
      currentPage: Number(page)
    });
  } catch (error) {
    logger.error('Get Audit Logs Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { getAuditLogs };
