const { app, appReady } = require('./app');
const config = require('./config/env');
const http = require('http');
const { Server } = require('socket.io');
const logger = require('./utils/logger');
const mongoose = require('mongoose');

const server = http.createServer(app);

const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',');

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

require('./sockets/chat.socket')(io);
require('./sockets/notification.socket')(io);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await appReady;

    server.listen(PORT, () => {
      logger.info(`
==========================================
🚀 Legal Services Marketplace API
==========================================
   Environment: ${config.nodeEnv}
   Port: ${PORT}
   Health: /api/health
   Docs: /api-docs
   API: /api
==========================================
      `);
    });

  } catch (error) {
    logger.error("❌ Server failed to start:", error);
    process.exit(1);
  }
};

const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Shutting down...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    } catch (error) {
      logger.error('Error closing MongoDB:', error);
    }

    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown (timeout)');
    process.exit(1);
  }, 10000);
};

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

module.exports = { server, io };