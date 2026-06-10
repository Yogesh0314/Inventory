const { getModels } = require('../config/db');
const logger = require('../utils/logger');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const models = getModels();

    // 1. Get total products count
    const totalProducts = await models.Product.countDocuments({});

    // 2. Get total stock value, low stock count, and category distribution
    const products = await models.Product.find({});
    let totalStockValue = 0;
    let lowStockCount = 0;
    const categoryMap = {};

    products.forEach(product => {
      totalStockValue += (product.price * product.quantity);
      if (product.quantity <= (product.minLimit || 5)) {
        lowStockCount++;
      }
      
      const cat = product.category || 'Uncategorized';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    const categoryData = Object.keys(categoryMap).map(name => ({
      name,
      value: categoryMap[name]
    }));

    // 3. Get all transactions for trend and summary
    const transactions = await models.Transaction.find({});
    
    // Recent transactions (last 5)
    const recentTransactions = [...transactions]
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
      .slice(0, 5);

    // 4. Get total sales and purchases value + Trend Data (Last 7 Days)
    let totalSalesValue = 0;
    let totalPurchasesValue = 0;
    
    const trendMap = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      trendMap[dateStr] = { date: dateStr, sales: 0, purchases: 0 };
    }

    transactions.forEach(tx => {
      const val = (tx.price * tx.quantity);
      if (tx.type === 'sale') {
        totalSalesValue += val;
      } else if (tx.type === 'purchase') {
        totalPurchasesValue += val;
      }

      const txDate = new Date(tx.date || tx.createdAt).toISOString().split('T')[0];
      if (trendMap[txDate]) {
        if (tx.type === 'sale') trendMap[txDate].sales += val;
        else if (tx.type === 'purchase') trendMap[txDate].purchases += val;
      }
    });

    const trendData = Object.values(trendMap);

    // 5. Get total suppliers count
    const totalSuppliers = await models.Supplier.countDocuments({});

    return res.json({
      totalProducts,
      totalStockValue: Number(totalStockValue.toFixed(2)),
      lowStockCount,
      totalSalesValue: Number(totalSalesValue.toFixed(2)),
      totalPurchasesValue: Number(totalPurchasesValue.toFixed(2)),
      totalSuppliers,
      recentTransactions,
      trendData,
      categoryData
    });
  } catch (error) {
    logger.error('Get Dashboard Stats Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getDashboardStats
};
