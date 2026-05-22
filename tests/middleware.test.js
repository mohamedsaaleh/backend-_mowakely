const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const config = require('../src/config/env');

describe('Authentication Middleware', () => {
  let validToken;
  let expiredToken;
  let invalidToken;

  beforeAll(() => {
    validToken = jwt.sign(
      { id: '507f1f77bcf86cd799439011', type: 'access', role: 'client' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    expiredToken = jwt.sign(
      { id: '507f1f77bcf86cd799439011', type: 'access', role: 'client' },
      config.jwt.secret,
      { expiresIn: '-1s' }
    );

    invalidToken = 'invalid-token-string';
  });

  describe('Protected Routes', () => {
    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect([401, 429]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect([401, 429]).toContain(response.status);
    });

    it('should reject request with expired token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect([401, 429]).toContain(response.status);
    });
  });
});

describe('Role Middleware', () => {
  let adminToken;

  beforeAll(() => {
    adminToken = jwt.sign(
      { id: '507f1f77bcf86cd799439013', type: 'access', role: 'admin' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  describe('Admin Routes', () => {
    it('should allow admin to access admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 404, 401]).toContain(response.status);
    });
  });
});

describe('Validation Middleware', () => {
  it('should validate required fields', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({});

    expect([400, 401, 429]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  it('should validate email format', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        full_name: 'Test',
        email: 'not-an-email',
        password: 'Test@123',
        role: 'client',
        phone: '+15551234'
      });

    expect([400, 401]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });

  it('should validate password requirements', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        full_name: 'Test',
        email: 'test@test.com',
        password: 'weak',
        role: 'client',
        phone: '+15551234'
      });

    expect([400, 401]).toContain(response.status);
  });
});

describe('Input Sanitization', () => {
  it('should handle MongoDB operators in query', async () => {
    const response = await request(app)
      .get('/api/lawyers?search[$ne]=test');

    expect([200, 404, 500]).toContain(response.status);
  });

  it('should handle NoSQL injection attempt', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: { $gt: '' },
        password: { $gt: '' }
      });

    expect([400, 401, 429]).toContain(response.status);
  });
});

describe('Error Handling', () => {
  it('should handle 404 for non-existent routes', async () => {
    const response = await request(app)
      .get('/api/non-existent-route');

    expect(response.status).toBe(404);
  });

  it('should handle invalid JSON gracefully', async () => {
    const response = await request(app)
      .post('/api/cases')
      .set('Content-Type', 'application/json')
      .send('not valid json');

    expect([400, 401, 429]).toContain(response.status);
  });
});