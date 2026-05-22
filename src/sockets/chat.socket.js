const jwt = require('jsonwebtoken');
const config = require('../config/env');
const logger = require('../utils/logger');
const constants = require('../constants');

module.exports = (io) => {
  const connectedUsers = new Map();

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, config.jwt.secret);
      const userId = decoded.id || decoded.userId;

      if (!userId) {
        return next(new Error('Invalid token'));
      }

      socket.userId = userId;
      socket.userRole = decoded.role;
      socket.userName = decoded.fullName || 'Unknown';

      next();
    } catch (error) {
      logger.error('Socket authentication error:', error.message);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userKey = `user_${socket.userId}`;

    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      connectedAt: new Date(),
      role: socket.userRole
    });

    socket.join(userKey);

    logger.info(`User connected: ${socket.userId} (${socket.userRole})`);

    io.emit('user_online', { userId: socket.userId });

    socket.on(constants.SOCKET.EVENTS.JOIN_ROOM, ({ caseId }) => {
      if (caseId) {
        const roomKey = `case_${caseId}`;
        socket.join(roomKey);
        socket.currentCaseRoom = roomKey;
        logger.debug(`User ${socket.userId} joined case room: ${caseId}`);
      }
    });

    socket.on(constants.SOCKET.EVENTS.LEAVE_ROOM, ({ caseId }) => {
      if (caseId) {
        const roomKey = `case_${caseId}`;
        socket.leave(roomKey);
        logger.debug(`User ${socket.userId} left case room: ${caseId}`);
      }
    });

    socket.on(constants.SOCKET.EVENTS.NEW_MESSAGE, (data) => {
      const { caseId, message, recipientId } = data;

      if (caseId) {
        const roomKey = `case_${caseId}`;
        io.to(roomKey).emit(constants.SOCKET.EVENTS.NEW_MESSAGE, {
          caseId,
          sender: {
            id: socket.userId,
            fullName: socket.userName,
            role: socket.userRole
          },
          message,
          timestamp: new Date().toISOString()
        });
      }

      if (recipientId) {
        const recipientRoom = `user_${recipientId}`;
        io.to(recipientRoom).emit(constants.SOCKET.EVENTS.NEW_MESSAGE, {
          sender: {
            id: socket.userId,
            fullName: socket.userName,
            role: socket.userRole
          },
          message,
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on(constants.SOCKET.EVENTS.MESSAGE_READ, ({ messageId, caseId }) => {
      if (caseId) {
        const roomKey = `case_${caseId}`;
        io.to(roomKey).emit(constants.SOCKET.EVENTS.MESSAGE_READ, {
          messageId,
          readBy: socket.userId,
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on(constants.SOCKET.EVENTS.TYPING_START, ({ caseId, recipientId }) => {
      if (caseId) {
        const roomKey = `case_${caseId}`;
        socket.to(roomKey).emit(constants.SOCKET.EVENTS.TYPING_START, {
          userId: socket.userId,
          fullName: socket.userName,
          caseId
        });
      }

      if (recipientId) {
        const recipientRoom = `user_${recipientId}`;
        io.to(recipientRoom).emit(constants.SOCKET.EVENTS.TYPING_START, {
          userId: socket.userId,
          fullName: socket.userName
        });
      }
    });

    socket.on(constants.SOCKET.EVENTS.TYPING_STOP, ({ caseId, recipientId }) => {
      if (caseId) {
        const roomKey = `case_${caseId}`;
        socket.to(roomKey).emit(constants.SOCKET.EVENTS.TYPING_STOP, {
          userId: socket.userId,
          caseId
        });
      }

      if (recipientId) {
        const recipientRoom = `user_${recipientId}`;
        io.to(recipientRoom).emit(constants.SOCKET.EVENTS.TYPING_STOP, {
          userId: socket.userId
        });
      }
    });

    socket.on('ping_server', () => {
      socket.emit('pong_client', { timestamp: Date.now() });
    });

    socket.on('disconnect', (reason) => {
      connectedUsers.delete(socket.userId);

      if (socket.currentCaseRoom) {
        socket.leave(socket.currentCaseRoom);
      }

      logger.info(`User disconnected: ${socket.userId}, reason: ${reason}`);

      io.emit('user_offline', { userId: socket.userId });
    });

    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.userId}:`, error);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      logger.debug(`Reconnection attempt ${attemptNumber} for user ${socket.userId}`);
    });

    socket.on('reconnect', () => {
      connectedUsers.set(socket.userId, {
        socketId: socket.id,
        connectedAt: new Date(),
        role: socket.userRole
      });

      logger.info(`User reconnected: ${socket.userId}`);
      io.emit('user_online', { userId: socket.userId });
    });
  });

  io.getOnlineUsers = () => {
    return Array.from(connectedUsers.keys());
  };

  io.isUserOnline = (userId) => {
    return connectedUsers.has(userId);
  };

  io.sendToUser = (userId, event, data) => {
    const userRoom = `user_${userId}`;
    io.to(userRoom).emit(event, data);
  };

  io.sendToCase = (caseId, event, data) => {
    const caseRoom = `case_${caseId}`;
    io.to(caseRoom).emit(event, data);
  };

  io.broadcastToAll = (event, data) => {
    io.emit(event, data);
  };

  return io;
};