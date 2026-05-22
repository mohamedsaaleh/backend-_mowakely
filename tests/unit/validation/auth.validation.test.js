const {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('../../../src/modules/auth/auth.validation');

describe('Auth Validation Unit Tests', () => {
  describe('registerSchema', () => {
    const validData = {
      full_name: 'John Doe',
      email: 'john@example.com',
      password: 'Test@123456',
      role: 'client',
      phone: '+1-555-1234'
    };

    it('should accept valid registration data', () => {
      const { error, value } = registerSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value.full_name).toBe('John Doe');
      expect(value.email).toBe('john@example.com');
      expect(value.password).toBe('Test@123456');
      expect(value.role).toBe('client');
      expect(value.phone).toBe('+1-555-1234');
    });

    it('should accept lawyer role with specialization', () => {
      const data = { ...validData, role: 'lawyer', specialization: 'Family Law' };
      const { error } = registerSchema.validate(data);
      expect(error).toBeUndefined();
    });

    it('should accept admin role', () => {
      const data = { ...validData, role: 'admin' };
      const { error } = registerSchema.validate(data);
      expect(error).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const data = { ...validData, email: 'invalid-email' };
      const { error } = registerSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('email');
    });

    it('should reject short full_name', () => {
      const data = { ...validData, full_name: 'A' };
      const { error } = registerSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('full_name');
    });

    it('should reject long full_name', () => {
      const data = { ...validData, full_name: 'a'.repeat(101) };
      const { error } = registerSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('full_name');
    });

    it('should reject short password', () => {
      const data = { ...validData, password: '123' };
      const { error } = registerSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('password');
    });

    it('should reject invalid role', () => {
      const data = { ...validData, role: 'superuser' };
      const { error } = registerSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('role');
    });

    it('should reject missing required fields', () => {
      const { error } = registerSchema.validate({});
      expect(error).toBeDefined();
      expect(error.details.length).toBeGreaterThanOrEqual(1);
    });

    it('should require phone field', () => {
      const data = {
        full_name: 'John Doe',
        email: 'john@example.com',
        password: 'Test@123456',
        role: 'client'
      };
      const { error } = registerSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('phone');
    });

    it('should require specialization for lawyer role', () => {
      const data = {
        full_name: 'John Doe',
        email: 'john@example.com',
        password: 'Test@123456',
        role: 'lawyer',
        phone: '+1-555-1234'
      };
      const { error } = registerSchema.validate(data);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('specialization');
    });

    it('should accept lawyer with all lawyer fields', () => {
      const data = {
        ...validData,
        role: 'lawyer',
        specialization: 'Family Law',
        years_of_experience: 5,
        office_address: '123 Main St'
      };
      const { error } = registerSchema.validate(data);
      expect(error).toBeUndefined();
    });

    it('should accept optional city field', () => {
      const data = { ...validData, city: 'New York' };
      const { error } = registerSchema.validate(data);
      expect(error).toBeUndefined();
    });

    it('should accept empty optional fields', () => {
      const data = {
        ...validData,
        city: '',
        bio: ''
      };
      const { error } = registerSchema.validate(data);
      expect(error).toBeUndefined();
    });

    it('should accept lawyer with years_of_experience', () => {
      const data = {
        ...validData,
        role: 'lawyer',
        specialization: 'Corporate Law',
        years_of_experience: 10
      };
      const { error } = registerSchema.validate(data);
      expect(error).toBeUndefined();
    });
  });

  describe('loginSchema', () => {
    const validData = {
      email: 'john@example.com',
      password: 'Test@123456'
    };

    it('should accept valid login data', () => {
      const { error, value } = loginSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value.email).toBe('john@example.com');
      expect(value.password).toBe('Test@123456');
    });

    it('should reject invalid email', () => {
      const data = { ...validData, email: 'invalid' };
      const { error } = loginSchema.validate(data);
      expect(error).toBeDefined();
    });

    it('should reject missing email', () => {
      const data = { password: 'Test@123456' };
      const { error } = loginSchema.validate(data);
      expect(error).toBeDefined();
    });

    it('should reject missing password', () => {
      const data = { email: 'john@example.com' };
      const { error } = loginSchema.validate(data);
      expect(error).toBeDefined();
    });

    it('should reject empty email', () => {
      const data = { email: '', password: 'Test@123456' };
      const { error } = loginSchema.validate(data);
      expect(error).toBeDefined();
    });
  });

  describe('refreshTokenSchema', () => {
    it('should accept valid refresh token', () => {
      const data = { refreshToken: 'valid-token-string' };
      const { error, value } = refreshTokenSchema.validate(data);
      expect(error).toBeUndefined();
      expect(value.refreshToken).toBe('valid-token-string');
    });

    it('should reject missing refresh token', () => {
      const { error } = refreshTokenSchema.validate({});
      expect(error).toBeDefined();
    });

    it('should reject empty refresh token', () => {
      const data = { refreshToken: '' };
      const { error } = refreshTokenSchema.validate(data);
      expect(error).toBeDefined();
    });
  });

  describe('forgotPasswordSchema', () => {
    it('should accept valid email', () => {
      const data = { email: 'john@example.com' };
      const { error, value } = forgotPasswordSchema.validate(data);
      expect(error).toBeUndefined();
      expect(value.email).toBe('john@example.com');
    });

    it('should reject invalid email', () => {
      const data = { email: 'invalid' };
      const { error } = forgotPasswordSchema.validate(data);
      expect(error).toBeDefined();
    });

    it('should reject missing email', () => {
      const { error } = forgotPasswordSchema.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('resetPasswordSchema', () => {
    it('should accept valid password', () => {
      const data = { password: 'NewPassword@123' };
      const { error, value } = resetPasswordSchema.validate(data);
      expect(error).toBeUndefined();
      expect(value.password).toBe('NewPassword@123');
    });

    it('should reject short password', () => {
      const data = { password: '123' };
      const { error } = resetPasswordSchema.validate(data);
      expect(error).toBeDefined();
    });

    it('should reject long password', () => {
      const data = { password: 'a'.repeat(101) };
      const { error } = resetPasswordSchema.validate(data);
      expect(error).toBeDefined();
    });

    it('should reject missing password', () => {
      const { error } = resetPasswordSchema.validate({});
      expect(error).toBeDefined();
    });

    it('should accept 6 character password', () => {
      const data = { password: '123456' };
      const { error } = resetPasswordSchema.validate(data);
      expect(error).toBeUndefined();
    });
  });
});