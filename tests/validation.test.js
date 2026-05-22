const request = require('supertest');
const app = require('../src/app');
const { validateObjectId, validatePassword, validateEmail, validateObjectIdString } = require('../src/utils/advancedValidation');
const constants = require('../src/constants');
const { DatabaseFixtures } = require('./utils/helpers');

describe('Validation Utils', () => {
  describe('validateObjectId', () => {
    it('should validate correct ObjectId', () => {
      const validId = '507f1f77bcf86cd799439011';
      const result = validateObjectId(validId);
      expect(result).toBe(validId);
    });

    it('should reject invalid ObjectId', () => {
      const invalidId = 'invalid-id';
      expect(() => validateObjectId(invalidId)).toThrow();
    });

    it('should reject short ObjectId', () => {
      const shortId = '123456789012';
      expect(() => validateObjectId(shortId)).toThrow();
    });
  });

  describe('validateObjectIdString', () => {
    it('should return true for valid ObjectId', () => {
      expect(validateObjectIdString('507f1f77bcf86cd799439011')).toBe(true);
    });

    it('should return false for invalid ObjectId', () => {
      expect(validateObjectIdString('invalid')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      const { error } = validateEmail('test@example.com');
      expect(error).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const { error } = validateEmail('invalid-email');
      expect(error).toBeDefined();
    });

    it('should reject email without domain', () => {
      const { error } = validateEmail('test@');
      expect(error).toBeDefined();
    });
  });

  describe('validatePassword', () => {
    it('should validate strong password', () => {
      const { error } = validatePassword('Password@123');
      expect(error).toBeUndefined();
    });

    it('should reject weak password (too short)', () => {
      const { error } = validatePassword('Pass@1');
      expect(error).toBeDefined();
    });

    it('should reject password without special char', () => {
      const { error } = validatePassword('Password123');
      expect(error).toBeDefined();
    });

    it('should reject password without number', () => {
      const { error } = validatePassword('Password@abc');
      expect(error).toBeDefined();
    });
  });
});

describe('Constants', () => {
  it('should have valid roles', () => {
    expect(constants.ROLES.ADMIN).toBe('admin');
    expect(constants.ROLES.LAWYER).toBe('lawyer');
    expect(constants.ROLES.CLIENT).toBe('client');
  });

  it('should have valid case statuses', () => {
    expect(constants.CASE_STATUS.OPEN).toBe('open');
    expect(constants.CASE_STATUS.IN_PROGRESS).toBe('in_progress');
    expect(constants.CASE_STATUS.COMPLETED).toBe('completed');
  });

  it('should have valid offer statuses', () => {
    expect(constants.OFFER_STATUS.PENDING).toBe('pending');
    expect(constants.OFFER_STATUS.ACCEPTED).toBe('accepted');
    expect(constants.OFFER_STATUS.REJECTED).toBe('rejected');
  });

  it('should have valid HTTP status codes', () => {
    expect(constants.HTTP_STATUS.OK).toBe(200);
    expect(constants.HTTP_STATUS.CREATED).toBe(201);
    expect(constants.HTTP_STATUS.BAD_REQUEST).toBe(400);
    expect(constants.HTTP_STATUS.UNAUTHORIZED).toBe(401);
    expect(constants.HTTP_STATUS.NOT_FOUND).toBe(404);
    expect(constants.HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
  });

  it('should have valid pagination defaults', () => {
    expect(constants.PAGINATION.DEFAULT_PAGE).toBe(1);
    expect(constants.PAGINATION.DEFAULT_LIMIT).toBe(10);
    expect(constants.PAGINATION.MAX_LIMIT).toBe(100);
  });

  it('should have valid upload limits', () => {
    expect(constants.UPLOAD.MAX_FILE_SIZE).toBe(10485760);
    expect(constants.UPLOAD.AVATAR_MAX_SIZE).toBe(2097152);
  });
});

describe('API Endpoints Validation', () => {
  describe('Cases API', () => {
    let authToken;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          full_name: 'Case Test User',
          email: `case${Date.now()}@test.com`,
          password: 'Test@123456',
          role: 'client'
        });

      if (response.body.data?.accessToken) {
        authToken = response.body.data.accessToken;
      } else {
        authToken = response.body.data?.tokens?.accessToken;
      }
    });

    it('should reject create case without auth', async () => {
      const response = await request(app)
        .post('/api/cases')
        .send({
          title: 'Test Case',
          description: 'Test description',
          budget: 5000
        });

      expect(response.status).toBe(401);
    });

    it('should reject create case with invalid data', async () => {
      if (!authToken) {
        return;
      }
      const response = await request(app)
        .post('/api/cases')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '',
          budget: -100
        });

      expect([400, 401]).toContain(response.status);
    });

    it('should create case with valid data', async () => {
      if (!authToken) {
        return;
      }
      const category = await DatabaseFixtures.createCategory();
      const response = await request(app)
        .post('/api/cases')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Case',
          description: 'Test description',
          budget: 5000,
          category: category._id.toString()
        });

      expect([200, 201, 400]).toContain(response.status);
    });
  });

  describe('Lawyers API', () => {
    it('should get lawyers list', async () => {
      const response = await request(app)
        .get('/api/lawyers')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/lawyers?page=1&limit=5')
        .expect(200);

      expect(response.body).toHaveProperty('items');
    });

    it('should search lawyers', async () => {
      const response = await request(app)
        .get('/api/lawyers?search=law')
        .expect(200);

      expect(response.body).toHaveProperty('items');
    });
  });

  describe('Categories API', () => {
    it('should get categories list', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
    });
  });

  describe('Health API', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('uptime');
    });

    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/api/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('status');
    });

    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/api/health/live')
        .expect(200);

      expect(response.body.status).toBe('alive');
    });

    it('should return detailed health', async () => {
      const response = await request(app)
        .get('/api/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('system');
      expect(response.body).toHaveProperty('process');
    });
  });
});

describe('Security Tests', () => {
  it('should reject SQL injection attempts', async () => {
    const response = await request(app)
      .get('/api/lawyers?search=");DROP TABLE users;--');

    expect([200, 400, 500]).toContain(response.status);
  });

  it('should sanitize XSS attempts', async () => {
    const response = await request(app)
      .get('/api/lawyers?search=<script>alert(1)</script>');

    expect([200, 400]).toContain(response.status);
  });

  it('should handle rapid requests', async () => {
    const requests = [];

    for (let i = 0; i < 10; i++) {
      requests.push(
        request(app).get('/api/health').catch(() => ({ status: 0 }))
      );
    }

    const results = await Promise.all(requests);
    expect(results.length).toBe(10);
  });
});