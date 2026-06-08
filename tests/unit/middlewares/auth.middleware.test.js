jest.mock('bcryptjs', () => ({
  genSalt: (rounds) => Promise.resolve(`salt_${rounds}`),
  hash: (password, salt) => Promise.resolve(`hashed_${password}_${salt}`),
  compare: (password, hash) => Promise.resolve(true)
}));

const { authenticate, optionalAuth } = require('../../../src/middlewares/auth.middleware');
const jwt = require('jsonwebtoken');
const { User } = require('../../../src/modules/users/users.model');
const { AppError } = require('../../../src/middlewares/error.middleware');
const DatabaseFixtures = require('../../utils/fixtures');

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-minimum-32-characters-long';

describe('Auth Middleware Unit Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {}
    };
    mockRes = {};
    mockNext = jest.fn();
  });

  describe('authenticate', () => {
    it('should call next with error if no token provided', async () => {
      await authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toBe('You are not logged in. Please log in to get access.');
      expect(error.statusCode).toBe(401);
    });

    it('should call next with error if token is in wrong format', async () => {
      mockReq.headers.authorization = 'InvalidFormat token';

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
    });

    it('should call next with error if token is invalid', async () => {
      mockReq.headers.authorization = 'Bearer invalid.token.here';

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toBe('Authentication failed. Please log in again.');
    });

    it('should call next with error if token has wrong type', async () => {
      const refreshToken = jwt.sign(
        { id: 'test-id', type: 'refresh' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );
      mockReq.headers.authorization = `Bearer ${refreshToken}`;

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toBe('Invalid token type');
    });

    it('should call next with error if user does not exist', async () => {
      const token = jwt.sign(
        { id: '507f1f77bcf86cd799439011', type: 'access' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );
      mockReq.headers.authorization = `Bearer ${token}`;

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toBe('User no longer exists.');
    });

    it('should call next with error if user is banned', async () => {
      const user = await DatabaseFixtures.createUser({
        is_banned: true
      });

      const token = jwt.sign(
        { id: user._id.toString(), type: 'access' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );
      mockReq.headers.authorization = `Bearer ${token}`;

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toBe('Your account has been banned. Contact support.');
      expect(error.statusCode).toBe(403);
    });

    it('should set req.user and call next if token is valid', async () => {
      const user = await DatabaseFixtures.createUser();

      const token = jwt.sign(
        { id: user._id.toString(), type: 'access' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );
      mockReq.headers.authorization = `Bearer ${token}`;

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user._id.toString()).toBe(user._id.toString());
    });

    it('should call next with error if token is expired', async () => {
      const expiredToken = jwt.sign(
        { id: '507f1f77bcf86cd799439011', type: 'access' },
        JWT_SECRET,
        { expiresIn: '-1s' }
      );
      mockReq.headers.authorization = `Bearer ${expiredToken}`;

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toBe('Token expired. Please log in again.');
    });

    it('should correctly parse Bearer token from authorization header', async () => {
      const user = await DatabaseFixtures.createUser();

      const token = jwt.sign(
        { id: user._id.toString(), type: 'access' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );
      mockReq.headers.authorization = `Bearer ${token}`;

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.email).toBe(user.email);
    });
  });

  describe('optionalAuth', () => {
    it('should call next without error if no token', async () => {
      await optionalAuth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.user).toBeUndefined();
    });

    it('should set req.user if token is valid', async () => {
      const user = await DatabaseFixtures.createUser();

      const token = jwt.sign(
        { id: user._id.toString(), type: 'access' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );
      mockReq.headers.authorization = `Bearer ${token}`;

      await optionalAuth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.user).toBeDefined();
    });

    it('should not set req.user if token is invalid', async () => {
      mockReq.headers.authorization = 'Bearer invalid.token';

      await optionalAuth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.user).toBeUndefined();
    });

    it('should not set req.user if user is banned', async () => {
      const user = await DatabaseFixtures.createUser({ is_banned: true });

      const token = jwt.sign(
        { id: user._id.toString(), type: 'access' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );
      mockReq.headers.authorization = `Bearer ${token}`;

      await optionalAuth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.user).toBeUndefined();
    });

    it('should not set req.user if token has wrong type', async () => {
      const token = jwt.sign(
        { id: '507f1f77bcf86cd799439011', type: 'refresh' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );
      mockReq.headers.authorization = `Bearer ${token}`;

      await optionalAuth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.user).toBeUndefined();
    });

    it('should continue to next even if token verification fails', async () => {
      mockReq.headers.authorization = 'Bearer malformed.token.here';

      await optionalAuth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.user).toBeUndefined();
    });
  });
});