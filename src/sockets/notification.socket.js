const logger = require('../utils/logger');
const constants = require('../constants');

module.exports = (io) => {
  io.on('connection', (socket) => {
    logger.debug('Notification socket connected');

    socket.on('subscribe_notifications', ({ userId }) => {
      if (userId) {
        const roomKey = `notifications_${userId}`;
        socket.join(roomKey);
        socket.userNotificationRoom = roomKey;
        socket.userId = userId;
        logger.debug(`User ${userId} subscribed to notifications`);
      }
    });

    socket.on('unsubscribe_notifications', ({ userId }) => {
      if (userId) {
        const roomKey = `notifications_${userId}`;
        socket.leave(roomKey);
        logger.debug(`User ${userId} unsubscribed from notifications`);
      }
    });

    socket.on('mark_read', async ({ notificationId, userId }) => {
      if (notificationId && userId) {
        socket.to(`notifications_${userId}`).emit('notification_read', {
          notificationId
        });
      }
    });

    socket.on('mark_all_read', async ({ userId }) => {
      if (userId) {
        socket.to(`notifications_${userId}`).emit('all_notifications_read', {
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on('disconnect', () => {
      logger.debug('Notification socket disconnected');
    });

    socket.on('error', (error) => {
      logger.error('Notification socket error:', error);
    });
  });

  io.emitNotification = (userId, notification) => {
    const roomKey = `notifications_${userId}`;
    io.to(roomKey).emit(constants.SOCKET.EVENTS.NOTIFICATION, notification);
    logger.debug(`Notification emitted to user ${userId}`);
  };

  io.emitNotificationToMultiple = (userIds, notification) => {
    userIds.forEach(userId => {
      io.emitNotification(userId, notification);
    });
  };

  io.broadcastNotification = (notification) => {
    io.emit(constants.SOCKET.EVENTS.NOTIFICATION, notification);
  };

  io.emitSystemNotification = (userId, type, message, data = {}) => {
    const notification = {
      type: constants.NOTIFICATION_TYPE.SYSTEM,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    io.emitNotification(userId, notification);
  };

  return io;
};