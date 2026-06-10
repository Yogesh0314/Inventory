const app = require('./app');
const logger = require('./utils/logger');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect database adapter
    await connectDB();

    // Listen
    app.listen(PORT, () => {
      logger.info(`====================================================`);
      logger.info(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
      logger.info(`🔌 Listening on port: http://localhost:${PORT}`);
      logger.info(`====================================================`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
