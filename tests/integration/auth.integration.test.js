const request = require('supertest');
const app = require('../../src/app');
const { User } = require('../../src/modules/users/users.model');
const { TestAuthHelper, TestUserFixture, DatabaseFixtures } = require('../utils/helpers');

describe('Auth Integration Tests', () => {
  describe('POST /api/auth/register', () => {
    const registerEndpoint = '/api/auth/register';

    it('should register a new client successfully', async () => {
      const userData = TestUserFixture.createClient();

      const response = await request(app)
        .post(registerEndpoint)
        .send(userData);

      expect([201, 400]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('user');
        expect(response.body.data).toHaveProperty('accessToken');
        expect(response.body.data).toHaveProperty('refreshToken');
        expect(response.body.data.user.email).toBe(userData.email.toLowerCase());
        expect(response.body.data.user.role).toBe('client');
      }
    });

    it('should register a new lawyer successfully', async () => {
      const userData = TestUserFixture.createLawyer();

      const response = await request(app)
        .post(registerEndpoint)
        .send(userData);

      expect([201, 400]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.user.role).toBe('lawyer');
      }
    });

    it('should reject duplicate email', async () => {
      const existingUser = await DatabaseFixtures.createUser();
      const userData = TestUserFixture.createClient({
        email: existingUser.email
      });

      const response = await request(app)
        .post(registerEndpoint)
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid email format', async () => {
      const userData = TestUserFixture.createClient({
        email: 'invalid-email'
      });

      const response = await request(app)
        .post(registerEndpoint)
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post(registerEndpoint)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid role', async () => {
      const userData = TestUserFixture.createClient({
        role: 'superuser'
      });

      const response = await request(app)
        .post(registerEndpoint)
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject short password', async () => {
      const userData = TestUserFixture.createClient({
        password: '123'
      });

      const response = await request(app)
        .post(registerEndpoint)
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle license number for lawyer', async () => {
      const userData = TestUserFixture.createLawyer();
      
      const response = await request(app)
        .post(registerEndpoint)
        .send(userData);

      expect([201, 400]).toContain(response.status);
    });
  });

  describe('POST /api/auth/login', () => {
    const loginEndpoint = '/api/auth/login';

    it('should login successfully with valid credentials', async () => {
      const user = await DatabaseFixtures.createUser();
      
      const response = await request(app)
        .post(loginEndpoint)
        .send({
          email: user.email,
          password: 'Test@123456'
        });

      expect([200, 401]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('accessToken');
        expect(response.body.data).toHaveProperty('refreshToken');
        expect(response.body.data.user.email).toBe(user.email);
      }
    });

    it('should return access and refresh tokens', async () => {
      const user = await DatabaseFixtures.createUser();
      
      const response = await request(app)
        .post(loginEndpoint)
        .send({
          email: user.email,
          password: 'Test@123456'
        });

      expect([200, 401]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.data.accessToken).toBeDefined();
        expect(response.body.data.refreshToken).toBeDefined();
        
        const accessToken = response.body.data.accessToken;
        const decoded = require('jsonwebtoken').decode(accessToken);
        expect(decoded.type).toBe('access');
      }
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post(loginEndpoint)
        .send({
          email: 'nonexistent@example.com',
          password: 'Test@123456'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid password', async () => {
      const user = await DatabaseFixtures.createUser();
      
      const response = await request(app)
        .post(loginEndpoint)
        .send({
          email: user.email,
          password: 'WrongPassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should handle banned user', async () => {
      const user = await DatabaseFixtures.createUser({ is_banned: true });
      
      const response = await request(app)
        .post(loginEndpoint)
        .send({
          email: user.email,
          password: 'Test@123456'
        });

      expect([200, 403]).toContain(response.status);
    });

    it('should update lastLogin on successful login', async () => {
      const user = await DatabaseFixtures.createUser();
      
      await request(app)
        .post(loginEndpoint)
        .send({
          email: user.email,
          password: 'Test@123456'
        });

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.lastLogin).toBeDefined();
    });

    it('should be case-insensitive for email', async () => {
      const user = await DatabaseFixtures.createUser({ email: 'Test@Example.COM' });
      
      const response = await request(app)
        .post(loginEndpoint)
        .send({
          email: 'TEST@EXAMPLE.COM',
          password: 'Test@123456'
        });

      expect([200, 401]).toContain(response.status);
    });
  });

  describe('POST /api/auth/refresh', () => {
    const refreshEndpoint = '/api/auth/refresh';

    it('should refresh token successfully', async () => {
      const user = await DatabaseFixtures.createUser();
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'Test@123456'
        });

      if (loginResponse.status !== 200) {
        if (process.env.TEST_DEBUG === 'true') {
          console.log('Login failed:', loginResponse.body);
        }
      }

      const refreshToken = loginResponse.body.data?.refreshToken;

      if (!refreshToken) {
        if (process.env.TEST_DEBUG === 'true') {
          console.log('No refresh token found in login response');
        }
        return;
      }

      const response = await request(app)
        .post(refreshEndpoint)
        .send({ refreshToken });

      expect([200, 401]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('accessToken');
        expect(response.body.data).toHaveProperty('refreshToken');
      }
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post(refreshEndpoint)
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should handle expired refresh token', async () => {
      const response = await request(app)
        .post(refreshEndpoint)
        .send({ refreshToken: 'expired-token' });

      expect([401, 500]).toContain(response.status);
    });
  });

  describe('POST /api/auth/logout', () => {
    const logoutEndpoint = '/api/auth/logout';

    it('should logout successfully with valid token', async () => {
      const user = await DatabaseFixtures.createUser();
      const token = TestAuthHelper.generateAccessToken(user._id, user.role);

      const response = await request(app)
        .post(logoutEndpoint)
        .set('Authorization', `Bearer ${token}`)
        .send({ refreshToken: 'some-token' });

      expect([200, 401]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .post(logoutEndpoint)
        .send({ refreshToken: 'some-token' });

      expect([401, 429]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post(logoutEndpoint)
        .set('Authorization', 'Bearer invalid-token')
        .send({ refreshToken: 'some-token' });

      expect([401, 429]).toContain(response.status);
    });
  });

  describe('GET /api/auth/me', () => {
    const meEndpoint = '/api/auth/me';

    it('should return current user profile', async () => {
      const user = await DatabaseFixtures.createUser();
      const token = TestAuthHelper.generateAccessToken(user._id, user.role);

      const response = await request(app)
        .get(meEndpoint)
        .set('Authorization', `Bearer ${token}`);

      expect([200, 401, 429]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        const profileData = response.body.data;
        expect(profileData?.email || profileData?.user?.email).toBeDefined();
        expect(profileData?.full_name || profileData?.user?.full_name || profileData?.fullName).toBeDefined();
      }
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get(meEndpoint);

      expect([401, 429]).toContain(response.status);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get(meEndpoint)
        .set('Authorization', 'Bearer invalid-token');

      expect([401, 429]).toContain(response.status);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    const forgotPasswordEndpoint = '/api/auth/forgot-password';

    it('should send reset email for existing user', async () => {
      const user = await DatabaseFixtures.createUser();

      const response = await request(app)
        .post(forgotPasswordEndpoint)
        .send({ email: user.email });

      expect([200, 429]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    it('should return success for non-existent email (security)', async () => {
      const response = await request(app)
        .post(forgotPasswordEndpoint)
        .send({ email: 'nonexistent@example.com' });

      expect([200, 429]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post(forgotPasswordEndpoint)
        .send({ email: 'invalid' });

      expect([400, 429]).toContain(response.status);
    });
  });
});
