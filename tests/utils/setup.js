require('dotenv').config({ path: '.env.test' });

jest.setTimeout(60000);

const mongoose = require('mongoose');
let isConnected = false;
let testCounter = 0;
const testDebug = process.env.TEST_DEBUG === 'true';

const testConfig = {
  NODE_ENV: 'test',
  JWT_SECRET: process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-minimum-32-chars',
  JWT_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  PORT: '3001',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/legal_marketplace_test',
  RATE_LIMIT_WINDOW_MS: '60000',
  RATE_LIMIT_MAX_REQUESTS: '1000',
  EMAIL_HOST: 'smtp.test.com',
  EMAIL_PORT: '587',
  EMAIL_USER: 'test@test.com',
  EMAIL_PASSWORD: 'testpass',
  FRONTEND_URL: 'http://localhost:3001',
  CORS_ORIGIN: '*',
  LOG_LEVEL: 'error'
};

Object.keys(testConfig).forEach(key => {
  if (!process.env[key]) {
    process.env[key] = testConfig[key];
  }
});

async function dropAllCollections() {
  if (mongoose.connection.readyState !== 1) return;
  
  const collections = mongoose.connection.collections;
  const dropPromises = Object.keys(collections).map(async (collectionName) => {
    try {
      await collections[collectionName].deleteMany({});
    } catch (error) {
      try {
        await collections[collectionName].deleteMany({ _id: { $exists: true } });
      } catch (e) {
        console.error(`Failed to clear collection ${collectionName}:`, e.message);
      }
    }
  });
  
  await Promise.all(dropPromises);
}

async function connectToDatabase() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      family: 4
    });
    isConnected = true;
    if (testDebug) {
      console.log('Test database connected');
    }
  } catch (error) {
    console.error('Failed to connect to test database:', error.message);
    throw error;
  }
}

beforeAll(async () => {
  if (testDebug) {
    console.log('Initializing test environment...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);
  }
  
  await connectToDatabase();
  
  jest.mock('../../src/utils/jobQueue', () => ({
    jobQueue: {
      getQueue: jest.fn(() => ({
        process: jest.fn(),
        on: jest.fn()
      })),
      addEmailJob: jest.fn(),
      addNotificationJob: jest.fn(),
      addCleanupJob: jest.fn(),
      addReminderJob: jest.fn()
    },
    emailJobs: {
      sendVerification: jest.fn().mockResolvedValue(true),
      sendPasswordReset: jest.fn().mockResolvedValue(true)
    },
    notificationJobs: {
      sendToUser: jest.fn().mockResolvedValue(true)
    },
    cleanupJobs: {},
    reminderJobs: {}
  }));

  jest.mock('../../src/utils/email', () => ({
    sendEmail: jest.fn().mockResolvedValue({ messageId: 'test-email-id' }),
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendOfferNotification: jest.fn().mockResolvedValue(true)
  }));

  if (testDebug) {
    console.log('Test environment initialized successfully');
  }
}, 60000);

beforeEach(async () => {
  await dropAllCollections();
  jest.clearAllMocks();
  jest.useRealTimers();
  
  testCounter++;
  if (testCounter % 3 === 0) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
});

afterEach(async () => {
  jest.resetModules();
});

afterAll(async () => {
  if (testDebug) {
    console.log('Cleaning up test environment...');
  }
  
  if (mongoose.connection.readyState === 1) {
    try {
      await dropAllCollections();
      await mongoose.connection.close();
      if (testDebug) {
        console.log('Database connection closed');
      }
    } catch (error) {
      console.error('Error during cleanup:', error.message);
    }
  }

  isConnected = false;
  if (testDebug) {
    console.log('Test environment cleanup completed');
  }
}, 30000);

expect.extend({
  toBeObject(received) {
    const pass = received !== null && typeof received === 'object' && !Array.isArray(received);
    return {
      pass,
      message: () => `expected ${received} to be an object`
    };
  },
  toHavePropertyWithValue(received, property, value) {
    const pass = received && typeof received === 'object' && property in received && received[property] === value;
    return {
      pass,
      message: () => `expected ${property} to have value ${value}`
    };
  },
  toContainObject(received, obj) {
    const pass = Array.isArray(received) && received.some(item => 
      Object.keys(obj).every(key => item[key] === obj[key])
    );
    return {
      pass,
      message: () => `expected array to contain object`
    };
  }
});

global.createMockRequest = (options = {}) => ({
  headers: {
    authorization: options.auth ? `Bearer ${options.auth}` : undefined,
    'content-type': 'application/json',
    ...options.headers
  },
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
  user: options.user || null,
  method: options.method || 'GET',
  path: options.path || '/',
  originalUrl: options.originalUrl || '/',
  ip: options.ip || '127.0.0.1',
  get: (header) => options.headers?.[header.toLowerCase()] || null
});

global.createMockResponse = () => {
  const res = {
    statusCode: 200,
    body: null,
    headers: {},
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    },
    send: function(data) {
      this.body = data;
      return this;
    },
    setHeader: function(key, value) {
      this.headers[key] = value;
      return this;
    },
    end: jest.fn()
  };
  return res;
};

global.createTestToken = (payload, secret = process.env.JWT_SECRET) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(payload, secret, { expiresIn: '1h' });
};

module.exports = { 
  mongoose,
  dropAllCollections,
  connectToDatabase 
};
