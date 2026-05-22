const { validate } = require('../../../src/middlewares/validate.middleware');

describe('Validate Middleware Unit Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      body: {}
    };
    mockRes = {
      statusCode: 200,
      body: null,
      status: jest.fn(function(code) {
        this.statusCode = code;
        return this;
      }),
      json: jest.fn(function(data) {
        this.body = data;
        return this;
      })
    };
    mockNext = jest.fn();
  });

  describe('validate', () => {
    it('should call next if validation passes', () => {
      const mockSchema = {
        validate: jest.fn().mockReturnValue({
          value: { name: 'John' },
          error: null
        })
      };

      mockReq.body = { name: 'John' };
      const middleware = validate(mockSchema);

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.body).toEqual({ name: 'John' });
    });

    it('should return 400 with validation error if validation fails', () => {
      const mockSchema = {
        validate: jest.fn().mockReturnValue({
          value: null,
          error: {
            details: [
              { path: ['email'], message: '"email" is required' }
            ]
          }
        })
      };

      mockReq.body = {};
      const middleware = validate(mockSchema);

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Validation error'
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return all validation error messages', () => {
      const mockSchema = {
        validate: jest.fn().mockReturnValue({
          value: null,
          error: {
            details: [
              { path: ['email'], message: '"email" is required' },
              { path: ['name'], message: '"name" is required' }
            ]
          }
        })
      };

      mockReq.body = {};
      const middleware = validate(mockSchema);

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({ field: 'email' }),
            expect.objectContaining({ field: 'name' })
          ])
        })
      );
    });

    it('should transform validated value to req.body', () => {
      const mockSchema = {
        validate: jest.fn().mockReturnValue({
          value: { name: 'John' },
          error: null
        })
      };

      mockReq.body = { name: 'John' };
      const middleware = validate(mockSchema);

      middleware(mockReq, mockRes, mockNext);

      expect(mockReq.body).toEqual({ name: 'John' });
    });

    it('should remove quotes from error messages', () => {
      const mockSchema = {
        validate: jest.fn().mockReturnValue({
          value: null,
          error: {
            details: [
              { path: ['email'], message: '"email" must be a valid email' }
            ]
          }
        })
      };

      mockReq.body = { email: 'invalid' };
      const middleware = validate(mockSchema);

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              message: 'email must be a valid email'
            })
          ])
        })
      );
    });
  });
});