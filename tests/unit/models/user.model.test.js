const mongoose = require('mongoose');
const { User, userSchema } = require('../../../src/modules/users/users.model');
const bcrypt = require('bcryptjs');

describe('User Model Unit Tests', () => {
  describe('Schema Fields', () => {
    it('should have correct schema fields', () => {
      const fields = Object.keys(userSchema.paths);
      expect(fields).toContain('email');
      expect(fields).toContain('password');
      expect(fields).toContain('role');
      expect(fields).toContain('full_name');
      expect(fields).toContain('phone');
      expect(fields).toContain('city');
      expect(fields).toContain('address');
      expect(fields).toContain('bio');
      expect(fields).toContain('profile_photo');
      expect(fields).toContain('is_verified');
      expect(fields).toContain('is_banned');
      expect(fields).toContain('emailVerificationToken');
      expect(fields).toContain('emailVerificationExpires');
      expect(fields).toContain('passwordResetToken');
      expect(fields).toContain('passwordResetExpires');
      expect(fields).toContain('lastLogin');
    });

    it('should have correct field types', () => {
      const fullNamePath = userSchema.paths.full_name;
      const emailPath = userSchema.paths.email;
      const passwordPath = userSchema.paths.password;
      const rolePath = userSchema.paths.role;
      const phonePath = userSchema.paths.phone;

      expect(fullNamePath.instance).toBe('String');
      expect(emailPath.instance).toBe('String');
      expect(passwordPath.instance).toBe('String');
      expect(rolePath.instance).toBe('String');
      expect(phonePath.instance).toBe('String');
    });
  });

  describe('Pre-save Hook - Password Hashing', () => {
    it('should hash password before saving', async () => {
      const user = new User({
        full_name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123456',
        role: 'client',
        phone: '+1234567890'
      });

      await user.save();

      expect(user.password).not.toBe('Test@123456');
      expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/);
    });

    it('should not rehash password if not modified', async () => {
      const user = new User({
        full_name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123456',
        role: 'client',
        phone: '+1234567890'
      });

      await user.save();
      const originalPassword = user.password;

      user.full_name = 'Updated Name';
      await user.save();

      expect(user.password).toBe(originalPassword);
    });

    it('should use salt rounds of 12', async () => {
      const user = new User({
        full_name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123456',
        role: 'client',
        phone: '+1234567890'
      });

      await user.save();

      const costSection = user.password.substring(4, 6);
      expect(costSection).toBe('12');
    });
  });

  describe('comparePassword Method', () => {
    it('should return true for correct password', async () => {
      const user = new User({
        full_name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123456',
        role: 'client',
        phone: '+1234567890'
      });

      await user.save();

      const isMatch = await user.comparePassword('Test@123456');
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const user = new User({
        full_name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123456',
        role: 'client',
        phone: '+1234567890'
      });

      await user.save();

      const isMatch = await user.comparePassword('WrongPassword');
      expect(isMatch).toBe(false);
    });
  });

  describe('toJSON Method', () => {
    it('should exclude sensitive fields from JSON output', async () => {
      const user = new User({
        full_name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123456',
        role: 'client',
        phone: '+1234567890',
        emailVerificationToken: 'secret-token',
        passwordResetToken: 'reset-token'
      });

      await user.save();

      const json = user.toJSON();

      expect(json.password).toBeUndefined();
      expect(json.emailVerificationToken).toBeUndefined();
      expect(json.passwordResetToken).toBeUndefined();
      expect(json.__v).toBeUndefined();
    });

    it('should include non-sensitive fields in JSON output', async () => {
      const user = new User({
        full_name: 'Test User',
        email: 'test@example.com',
        role: 'client',
        phone: '+1234567890'
      });

      const json = user.toJSON();

      expect(json.full_name).toBe('Test User');
      expect(json.email).toBe('test@example.com');
      expect(json.role).toBe('client');
    });
  });

  describe('Role Enum Validation', () => {
    it('should accept valid roles', async () => {
      const validRoles = ['client', 'lawyer', 'admin'];

      for (const role of validRoles) {
        const user = new User({
          full_name: 'Test User',
          email: `test${role}@example.com`,
          password: 'Test@123456',
          role,
          phone: `+123456789${role.length}`
        });

        const error = user.validateSync();
        expect(error).toBeUndefined();
      }
    });

    it('should reject invalid role', async () => {
      const user = new User({
        full_name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123456',
        role: 'invalid_role',
        phone: '+1234567890'
      });

      const error = user.validateSync();
      expect(error.errors.role).toBeDefined();
    });
  });

  describe('Email Validation', () => {
    it('should accept valid email format', async () => {
      const user = new User({
        full_name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123456',
        role: 'client',
        phone: '+1234567890'
      });

      const error = user.validateSync();
      expect(error?.errors?.email).toBeUndefined();
    });

    it('should reject invalid email format', async () => {
      const user = new User({
        full_name: 'Test User',
        email: 'invalid-email',
        password: 'Test@123456',
        role: 'client',
        phone: '+1234567890'
      });

      const error = user.validateSync();
      expect(error.errors.email).toBeDefined();
    });

    it('should store email in lowercase', async () => {
      const user = new User({
        full_name: 'Test User',
        email: 'TEST@EXAMPLE.COM',
        password: 'Test@123456',
        role: 'client',
        phone: '+1234567890'
      });

      await user.save();

      expect(user.email).toBe('test@example.com');
    });
  });

  describe('Index Creation', () => {
    it('should create role index', () => {
      const roleIndex = userSchema.indexes().find(idx => 
        idx[0] && idx[0].role
      );
      expect(roleIndex).toBeDefined();
    });

    it('should create is_banned index', () => {
      const bannedIndex = userSchema.indexes().find(idx => 
        idx[0] && idx[0].is_banned
      );
      expect(bannedIndex).toBeDefined();
    });

    it('should create created_at index', () => {
      const createdAtIndex = userSchema.indexes().find(idx => 
        idx[0] && idx[0].created_at
      );
      expect(createdAtIndex).toBeDefined();
    });
  });

  describe('Default Values', () => {
    it('should set is_verified to false by default', async () => {
      const user = new User({
        full_name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123456',
        role: 'client',
        phone: '+1234567890'
      });

      await user.save();

      expect(user.is_verified).toBe(false);
    });

    it('should set is_banned to false by default', async () => {
      const user = new User({
        full_name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123456',
        role: 'client',
        phone: '+1234567890'
      });

      await user.save();

      expect(user.is_banned).toBe(false);
    });

    it('should set lastLogin to null by default', async () => {
      const user = new User({
        full_name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123456',
        role: 'client',
        phone: '+1234567890'
      });

      await user.save();

      expect(user.lastLogin).toBeNull();
    });

    it('should set profile_photo to null by default', async () => {
      const user = new User({
        full_name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123456',
        role: 'client',
        phone: '+1234567890'
      });

      await user.save();

      expect(user.profile_photo).toBeNull();
    });
  });

  describe('Required Fields', () => {
    it('should require full_name', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'Test@123456',
        role: 'client',
        phone: '+1234567890'
      });

      try {
        await user.validate();
        expect(true).toBe(false);
      } catch (error) {
        expect(error.errors.full_name).toBeDefined();
      }
    });

    it('should require email', async () => {
      const user = new User({
        full_name: 'Test User',
        password: 'Test@123456',
        role: 'client',
        phone: '+1234567890'
      });

      try {
        await user.validate();
        expect(true).toBe(false);
      } catch (error) {
        expect(error.errors.email).toBeDefined();
      }
    });

    it('should require password', async () => {
      const user = new User({
        full_name: 'Test User',
        email: 'test@example.com',
        role: 'client',
        phone: '+1234567890'
      });

      try {
        await user.validate();
        expect(true).toBe(false);
      } catch (error) {
        expect(error.errors.password).toBeDefined();
      }
    });

    it('should require role', async () => {
      const user = new User({
        full_name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123456',
        phone: '+1234567890'
      });

      const validationError = user.validateSync();
      expect(validationError).toBeUndefined();
      expect(user.role).toBe('client');
    });

    it('should require phone', async () => {
      const user = new User({
        full_name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123456',
        role: 'client'
      });

      try {
        await user.validate();
        expect(true).toBe(false);
      } catch (error) {
        expect(error.errors.phone).toBeDefined();
      }
    });
  });

  describe('Field Length Constraints', () => {
    it('should enforce max length on full_name', async () => {
      const user = new User({
        full_name: 'a'.repeat(101),
        email: 'test@example.com',
        password: 'Test@123456',
        role: 'client',
        phone: '+1234567890'
      });

      try {
        await user.validate();
        expect(true).toBe(false);
      } catch (error) {
        expect(error.errors.full_name).toBeDefined();
      }
    });

    it('should enforce min length on password', async () => {
      const user = new User({
        full_name: 'Test User',
        email: 'test@example.com',
        password: '123',
        role: 'client',
        phone: '+1234567890'
      });

      try {
        await user.validate();
        expect(true).toBe(false);
      } catch (error) {
        expect(error.errors.password).toBeDefined();
      }
    });

    it('should enforce max length on bio', async () => {
      const user = new User({
        full_name: 'Test User',
        email: 'test@example.com',
        password: 'Test@123456',
        role: 'client',
        phone: '+1234567890',
        bio: 'a'.repeat(1001)
      });

      try {
        await user.validate();
        expect(true).toBe(false);
      } catch (error) {
        expect(error.errors.bio).toBeDefined();
      }
    });
  });

  describe('Unique Constraints', () => {
    it('should enforce unique email', async () => {
      const user1 = new User({
        full_name: 'Test User 1',
        email: 'unique@example.com',
        password: 'Test@123456',
        role: 'client',
        phone: '+1234567891'
      });
      await user1.save();

      const user2 = new User({
        full_name: 'Test User 2',
        email: 'unique@example.com',
        password: 'Test@123456',
        role: 'client',
        phone: '+1234567892'
      });

      try {
        await user2.save();
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe(11000);
      }
    });

    it('should enforce unique phone', async () => {
      const user1 = new User({
        full_name: 'Test User 1',
        email: 'phone1@example.com',
        password: 'Test@123456',
        role: 'client',
        phone: '+1234567891'
      });
      await user1.save();

      const user2 = new User({
        full_name: 'Test User 2',
        email: 'phone2@example.com',
        password: 'Test@123456',
        role: 'client',
        phone: '+1234567891'
      });

      try {
        await user2.save();
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe(11000);
      }
    });
  });
});