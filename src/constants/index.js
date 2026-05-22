module.exports = {
  ROLES: {
    ADMIN: 'admin',
    LAWYER: 'lawyer',
    CLIENT: 'client'
  },

  PERMISSIONS: {
    ADMIN: ['read', 'write', 'update', 'delete', 'manage'],
    LAWYER: ['read', 'write', 'update'],
    CLIENT: ['read', 'write']
  },

  CASE_STATUS: {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    PENDING_PAYMENT: 'pending_payment',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    DISPUTED: 'disputed'
  },

  CASE_PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
  },

  OFFER_STATUS: {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    EXPIRED: 'expired',
    WITHDRAWN: 'withdrawn'
  },

  MESSAGE_STATUS: {
    SENT: 'sent',
    DELIVERED: 'delivered',
    READ: 'read'
  },

  NOTIFICATION_TYPE: {
    OFFER_RECEIVED: 'offer_received',
    OFFER_ACCEPTED: 'offer_accepted',
    NEW_MESSAGE: 'new_message',
    REVIEW_ADDED: 'review_added'
  },

  INVOICE_STATUS: {
    PENDING: 'pending',
    PAID: 'paid',
    OVERDUE: 'overdue',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
  },

  PAYOUT_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  },

  REVIEW_STATUS: {
    PENDING: 'pending',
    PUBLISHED: 'published',
    HIDDEN: 'hidden'
  },

  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
  },

  API_MESSAGES: {
    SUCCESS: {
      CREATED: 'Resource created successfully',
      UPDATED: 'Resource updated successfully',
      DELETED: 'Resource deleted successfully',
      FETCHED: 'Data fetched successfully',
      LOGIN: 'Login successful',
      LOGOUT: 'Logout successful',
      REGISTER: 'Registration successful',
      VERIFIED: 'Verification successful',
      SENT: 'Request processed successfully'
    },
    ERROR: {
      NOT_FOUND: 'Resource not found',
      UNAUTHORIZED: 'Authentication required',
      FORBIDDEN: 'Access denied',
      VALIDATION: 'Validation error',
      SERVER: 'Internal server error',
      DUPLICATE: 'Resource already exists',
      INVALID: 'Invalid credentials',
      EXPIRED: 'Token expired',
      RATE_LIMIT: 'Too many requests'
    }
  },

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  },

  UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    AVATAR_MAX_SIZE: 2 * 1024 * 1024,
    DOCUMENT_MAX_SIZE: 20 * 1024 * 1024
  },

  JWT: {
    ACCESS_TOKEN_EXPIRY: '15m',
    REFRESH_TOKEN_EXPIRY: '7d',
    VERIFICATION_TOKEN_EXPIRY: '24h',
    RESET_TOKEN_EXPIRY: '1h'
  },

  RATE_LIMIT: {
    DEFAULT_WINDOW: 15 * 60 * 1000,
    DEFAULT_MAX: 100,
    AUTH_MAX: 20,
    UPLOAD_MAX: 10
  },

  CACHE: {
    TTL: {
      SHORT: 300,
      MEDIUM: 900,
      LONG: 3600,
      VERY_LONG: 86400
    }
  },

  SOCKET: {
    EVENTS: {
      CONNECTION: 'connection',
      DISCONNECT: 'disconnect',
      JOIN_ROOM: 'join_room',
      LEAVE_ROOM: 'leave_room',
      NEW_MESSAGE: 'new_message',
      MESSAGE_READ: 'message_read',
      TYPING_START: 'typing_start',
      TYPING_STOP: 'typing_stop',
      NOTIFICATION: 'notification',
      USER_ONLINE: 'user_online',
      USER_OFFLINE: 'user_offline'
    },
    ROOMS: {
      NOTIFICATIONS: (userId) => `notifications:${userId}`,
      MESSAGES: (caseId) => `messages:${caseId}`
    }
  },

  VALIDATION: {
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 100,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    DESCRIPTION_MAX_LENGTH: 5000
  }
};