const sinon = require('sinon');
const nock = require('nock');

class EmailMock {
  constructor() {
    this.sentEmails = [];
  }

  static mockSendEmail() {
    return sinon.stub().resolves({ messageId: 'test-message-id' });
  }

  static mockSendVerificationEmail() {
    return sinon.stub().resolves(true);
  }

  static mockSendPasswordResetEmail() {
    return sinon.stub().resolves(true);
  }

  static setup() {
    sinon.stub(require('../../src/utils/email'), 'sendEmail').resolves({ messageId: 'mock-id' });
    sinon.stub(require('../../src/utils/email'), 'sendVerificationEmail').resolves(true);
    sinon.stub(require('../../src/utils/email'), 'sendPasswordResetEmail').resolves(true);
  }

  static teardown() {
    sinon.restore();
  }
}

class JobQueueMock {
  constructor() {
    this.jobs = [];
  }

  static mockAddEmailJob() {
    return sinon.stub().resolves({
      id: 'mock-job-id',
      data: {}
    });
  }

  static mockAddNotificationJob() {
    return sinon.stub().resolves({
      id: 'mock-job-id',
      data: {}
    });
  }

  static setup() {
    const mockJobQueue = {
      addEmailJob: this.mockAddEmailJob(),
      addNotificationJob: this.mockAddNotificationJob(),
      addCleanupJob: sinon.stub().resolves({}),
      addReminderJob: sinon.stub().resolves({}),
      getQueue: sinon.stub().returns({
        process: sinon.stub(),
        on: sinon.stub()
      })
    };

    sinon.stub(require('../../src/utils/jobQueue'), 'jobQueue').value(mockJobQueue);
    sinon.stub(require('../../src/utils/jobQueue'), 'emailJobs').value({
      sendVerification: sinon.stub().resolves({}),
      sendPasswordReset: sinon.stub().resolves({})
    });
    sinon.stub(require('../../src/utils/jobQueue'), 'notificationJobs').value({
      sendToUser: sinon.stub().resolves({})
    });
  }

  static teardown() {
    sinon.restore();
  }
}

class RedisMock {
  constructor() {
    this.data = new Map();
  }

  get(key) {
    return Promise.resolve(this.data.get(key) || null);
  }

  set(key, value) {
    this.data.set(key, value);
    return Promise.resolve('OK');
  }

  del(key) {
    this.data.delete(key);
    return Promise.resolve(1);
  }

  expire(key, seconds) {
    return Promise.resolve(1);
  }

  ttl(key) {
    return Promise.resolve(-1);
  }

  keys(pattern) {
    const keys = Array.from(this.data.keys()).filter(k => k.match(pattern));
    return Promise.resolve(keys);
  }

  flushall() {
    this.data.clear();
    return Promise.resolve('OK');
  }

  static createMock() {
    return new RedisMock();
  }
}

class CacheHelper {
  static mockGet() {
    return sinon.stub().resolves(null);
  }

  static mockSet() {
    return sinon.stub().resolves(true);
  }

  static mockDel() {
    return sinon.stub().resolves(1);
  }

  static setup() {
    sinon.stub(require('../../src/utils/cache'), 'get').resolves(null);
    sinon.stub(require('../../src/utils/cache'), 'set').resolves(true);
    sinon.stub(require('../../src/utils/cache'), 'del').resolves(1);
  }

  static teardown() {
    sinon.restore();
  }
}

class HttpMock {
  /**
   * Mock external API calls
   */
  static mockExternalApi(baseUrl, path, response, statusCode = 200) {
    return nock(baseUrl)
      .get(path)
      .reply(statusCode, response);
  }

  /**
   * Mock external API with POST
   */
  static mockExternalApiPost(baseUrl, path, response, statusCode = 200) {
    return nock(baseUrl)
      .post(path)
      .reply(statusCode, response);
  }

  /**
   * Clean up all mocks
   */
  static cleanAll() {
    nock.cleanAll();
  }

  /**
   * Disable all external HTTP calls
   */
  static disableExternal() {
    nock.disableNetConnect();
  }

  /**
   * Enable external HTTP calls
   */
  static enableExternal() {
    nock.enableNetConnect();
  }
}

class LoggerMock {
  static mockInfo() {
    return sinon.stub().returns({});
  }

  static mockError() {
    return sinon.stub().returns({});
  }

  static mockWarn() {
    return sinon.stub().returns({});
  }

  static mockDebug() {
    return sinon.stub().returns({});
  }

  static setup() {
    const logger = require('../../src/utils/logger');
    sinon.stub(logger, 'info').returns(logger);
    sinon.stub(logger, 'error').returns(logger);
    sinon.stub(logger, 'warn').returns(logger);
    sinon.stub(logger, 'debug').returns(logger);
  }

  static teardown() {
    sinon.restore();
  }
}

class SocketIOMock {
  constructor() {
    this.connections = new Map();
    this.events = [];
  }

  static createServer() {
    return {
      use: sinon.stub(),
      on: sinon.stub(),
      emit: sinon.stub(),
      to: sinon.stub().returns({
        emit: sinon.stub()
      }),
      getOnlineUsers: sinon.stub().returns([]),
      isUserOnline: sinon.stub().returns(false),
      sendToUser: sinon.stub(),
      sendToCase: sinon.stub(),
      broadcastToAll: sinon.stub()
    };
  }

  static createClient() {
    return {
      connect: sinon.stub(),
      disconnect: sinon.stub(),
      emit: sinon.stub(),
      on: sinon.stub(),
      off: sinon.stub(),
      connected: true,
      id: 'mock-client-id'
    };
  }
}

class ValidationMock {
  static mockValidation(schema) {
    return {
      validate: sinon.stub().returns({
        value: {},
        error: null
      }),
      validateAsync: sinon.stub().resolves({
        value: {},
        error: null
      })
    };
  }

  static mockValidationError(schema, error) {
    return {
      validate: sinon.stub().returns({
        value: null,
        error: error
      }),
      validateAsync: sinon.stub().rejects(error)
    };
  }
}

class MulterMock {
  static createUploadMock() {
    return {
      single: () => (req, res, next) => {
        req.file = {
          fieldname: 'file',
          originalname: 'test.pdf',
          mimetype: 'application/pdf',
          size: 1024,
          destination: '/uploads',
          filename: 'test-123456.pdf'
        };
        next();
      },
      array: () => (req, res, next) => {
        req.files = [
          { fieldname: 'file', originalname: 'test.pdf', mimetype: 'application/pdf', size: 1024 }
        ];
        next();
      }
    };
  }

  static createUploadErrorMock() {
    return (error) => {
      return (req, res, next) => {
        next(error);
      };
    };
  }
}

function setupAllMocks() {
  LoggerMock.setup();
  EmailMock.setup();
  JobQueueMock.setup();
  CacheHelper.setup();
}

function teardownAllMocks() {
  LoggerMock.teardown();
  EmailMock.teardown();
  JobQueueMock.teardown();
  CacheHelper.teardown();
  HttpMock.cleanAll();
}

module.exports = {
  EmailMock,
  JobQueueMock,
  RedisMock,
  CacheHelper,
  HttpMock,
  LoggerMock,
  SocketIOMock,
  ValidationMock,
  MulterMock,
  setupAllMocks,
  teardownAllMocks
};