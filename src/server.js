const app = require('./app');
const config = require('./config/env');
const http = require('http');
const { Server } = require('socket.io');
const logger = require('./utils/logger');
const mongoose = require('mongoose');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

require('./sockets/chat.socket')(io);
require('./sockets/notification.socket')(io);

const PORT = config.port;

const startServer = () => {
  server.listen(PORT, () => {
    logger.info(`
==========================================
🚀 Legal Services Marketplace API
==========================================
   Environment: ${config.nodeEnv}
   Port: ${PORT}
   Health: http://localhost:${PORT}/api/health
   Docs: http://localhost:${PORT}/api-docs
   API: http://localhost:${PORT}/api
==========================================
    `);
  });
};

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await mongoose.connection.close();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error closing database:', error);
    }

    logger.info('Graceful shutdown completed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

module.exports = { server, io };