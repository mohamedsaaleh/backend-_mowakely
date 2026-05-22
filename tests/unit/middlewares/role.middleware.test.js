const { authorize } = require('../../../src/middlewares/role.middleware');

describe('Role Middleware Unit Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      user: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  describe('authorize', () => {
    it('should call next if user has required role - client', () => {
      mockReq.user.role = 'client';
      const middleware = authorize('client');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next if user has required role - lawyer', () => {
      mockReq.user.role = 'lawyer';
      const middleware = authorize('lawyer');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next if user has required role - admin', () => {
      mockReq.user.role = 'admin';
      const middleware = authorize('admin');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with AppError if user does not have required role', () => {
      mockReq.user.role = 'client';
      const middleware = authorize('admin');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Object));
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('is not authorized');
      expect(error.statusCode).toBe(403);
    });

    it('should work with multiple roles - user has one of them', () => {
      mockReq.user.role = 'lawyer';
      const middleware = authorize('client', 'lawyer', 'admin');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with error if user has none of the roles', () => {
      mockReq.user.role = 'client';
      const middleware = authorize('lawyer', 'admin');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Object));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toContain('client');
      expect(error.message).toContain('is not authorized');
    });

    it('should work with three roles', () => {
      mockReq.user.role = 'admin';
      const middleware = authorize('client', 'lawyer', 'admin');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle missing user role gracefully', () => {
      mockReq.user = {};
      const middleware = authorize('admin');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Object));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toContain('is not authorized');
    });
  });
});