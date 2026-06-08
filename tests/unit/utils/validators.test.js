const Joi = require('joi');
const { objectId, objectIdSchema, idParam, validateObjectId, parseSort, getPagination, buildFilter } = require('../../../src/utils/validators');
const { AppError } = require('../../../src/middlewares/error.middleware');

describe('validators', () => {
  describe('parseSort', () => {
    it('should return default sort when no argument', () => {
      expect(parseSort()).toEqual({ createdAt: -1 });
    });

    it('should parse descending sort', () => {
      expect(parseSort('-createdAt')).toEqual({ createdAt: -1 });
    });

    it('should parse ascending sort', () => {
      expect(parseSort('createdAt')).toEqual({ createdAt: 1 });
    });

    it('should parse multiple sort fields', () => {
      expect(parseSort('-createdAt,price')).toEqual({ createdAt: -1, price: 1 });
    });
  });

  describe('getPagination', () => {
    it('should return defaults when no arguments', () => {
      const result = getPagination();
      expect(result.skip).toBe(0);
      expect(result.limit).toBe(10);
      expect(result.page).toBe(1);
    });

    it('should compute skip correctly', () => {
      const result = getPagination(3, 20);
      expect(result.skip).toBe(40);
      expect(result.limit).toBe(20);
    });

    it('should cap limit at 100', () => {
      const result = getPagination(1, 500);
      expect(result.limit).toBe(100);
    });

    it('should fallback to defaults on NaN', () => {
      const result = getPagination('abc', null);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe('buildFilter', () => {
    it('should build filter from allowed fields', () => {
      const result = buildFilter({ status: 'open', city: 'NYC' }, ['status', 'city']);
      expect(result).toEqual({ status: 'open', city: 'NYC' });
    });

    it('should ignore non-allowed fields', () => {
      const result = buildFilter({ secret: 'value' }, ['status']);
      expect(result).toEqual({});
    });

    it('should build search filter', () => {
      const result = buildFilter({ search: 'test' }, []);
      expect(result.$or).toBeDefined();
      expect(result.$or).toHaveLength(2);
    });
  });

  describe('objectId', () => {
    it('should accept valid ObjectId', () => {
      const { error, value } = objectId.validate('507f1f77bcf86cd799439011');
      expect(error).toBeUndefined();
      expect(value).toBe('507f1f77bcf86cd799439011');
    });

    it('should reject invalid ObjectId', () => {
      const { error } = objectId.validate('abc123');
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('Invalid ID format');
    });
  });

  describe('objectIdSchema', () => {
    it('should validate valid id parameter', () => {
      const { error, value } = objectIdSchema.validate({ id: '507f1f77bcf86cd799439011' });
      expect(error).toBeUndefined();
    });

    it('should reject invalid id parameter', () => {
      const { error } = objectIdSchema.validate({ id: 'abc' });
      expect(error).toBeDefined();
    });
  });

  describe('idParam', () => {
    it('should create schema for custom param name', () => {
      const schema = idParam('userId');
      const { error } = schema.validate({ userId: '507f1f77bcf86cd799439011' });
      expect(error).toBeUndefined();
    });
  });

  describe('validateObjectId', () => {
    it('should not throw for valid ObjectId', () => {
      expect(() => validateObjectId('507f1f77bcf86cd799439011')).not.toThrow();
    });

    it('should throw AppError for invalid ObjectId', () => {
      expect(() => validateObjectId('abc')).toThrow(AppError);
    });
  });
});
