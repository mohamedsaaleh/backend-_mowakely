const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-minimum-32-chars';

class TestAuthHelper {
  static generateAccessToken(userId, role = 'client', options = {}) {
    return jwt.sign(
      {
        id: userId?.toString(),
        type: 'access',
        role,
        ...options
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
  }

  static generateRefreshToken(userId, role = 'client') {
    const crypto = require('crypto');
    return crypto.randomBytes(64).toString('hex');
  }

  static generateExpiredToken(userId) {
    return jwt.sign(
      { id: userId?.toString(), type: 'access', role: 'client' },
      JWT_SECRET,
      { expiresIn: '-1s' }
    );
  }

  static generateInvalidToken() {
    return 'invalid.token.string';
  }

  static createAuthHeader(userId, role = 'client') {
    const token = this.generateAccessToken(userId, role);
    return `Bearer ${token}`;
  }

  static extractTokens(response) {
    const body = response.body || {};
    
    if (body.success === false) return null;
    
    const data = body.data || body;
    
    if (data.accessToken !== undefined) {
      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || data.tokens?.refreshToken,
        user: data.user
      };
    }
    
    if (data.tokens?.accessToken) {
      return {
        accessToken: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken,
        user: data.user
      };
    }
    
    if (data.user?.accessToken) {
      return {
        accessToken: data.user.accessToken,
        refreshToken: data.user.refreshToken,
        user: data.user
      };
    }
    
    return null;
  }

  static getAccessToken(response) {
    const tokens = this.extractTokens(response);
    return tokens?.accessToken || null;
  }

  static getRefreshToken(response) {
    const tokens = this.extractTokens(response);
    return tokens?.refreshToken || null;
  }

  static getUserData(response) {
    const tokens = this.extractTokens(response);
    return tokens?.user || null;
  }
}

class TestUserFixture {
  static generateId() {
    const mongoose = require('mongoose');
    return new mongoose.Types.ObjectId().toString();
  }

  static generateTimestamp() {
    return Date.now() + Math.random().toString(36).substr(2, 5);
  }

  static create(overrides = {}) {
    return this.createUserData(overrides);
  }

  static createUserData(overrides = {}) {
    const timestamp = this.generateTimestamp();
    return {
      full_name: overrides.full_name || 'Test User',
      email: overrides.email || `test${timestamp}@example.com`,
      password: overrides.password || 'Test@123456',
      role: overrides.role || 'client',
      phone: overrides.phone || `+1555${timestamp.slice(-7)}`,
      city: overrides.city || 'New York',
      address: overrides.address || '123 Test St',
      ...overrides
    };
  }

  static createAdmin(overrides = {}) {
    const timestamp = this.generateTimestamp();
    return this.createUserData({
      full_name: 'Admin User',
      email: `admin${timestamp}@example.com`,
      role: 'admin',
      ...overrides
    });
  }

  static createLawyer(overrides = {}) {
    const timestamp = this.generateTimestamp();
    return this.createUserData({
      full_name: 'Lawyer User',
      email: `lawyer${timestamp}@example.com`,
      role: 'lawyer',
      specialization: 'Family Law',
      years_of_experience: 5,
      office_address: '123 Main St, New York',
      bio: 'Experienced lawyer',
      ...overrides
    });
  }

  static createClient(overrides = {}) {
    const timestamp = this.generateTimestamp();
    return this.createUserData({
      full_name: 'Client User',
      email: `client${timestamp}@example.com`,
      role: 'client',
      ...overrides
    });
  }

  static createUserData(overrides = {}) {
    const timestamp = this.generateTimestamp();
    return {
      full_name: overrides.full_name || 'Test User',
      email: overrides.email || `test${timestamp}@example.com`,
      password: overrides.password || 'Test@123456',
      role: overrides.role || 'client',
      phone: overrides.phone || `+1555${timestamp.slice(-7)}`,
      city: overrides.city || 'New York',
      address: overrides.address || '123 Test St',
      ...overrides
    };
  }

  static createAdminData(overrides = {}) {
    const timestamp = this.generateTimestamp();
    return this.createUserData({
      full_name: 'Admin User',
      email: `admin${timestamp}@example.com`,
      role: 'admin',
      ...overrides
    });
  }

  static createLawyerData(overrides = {}) {
    const timestamp = this.generateTimestamp();
    return this.createUserData({
      full_name: 'Lawyer User',
      email: `lawyer${timestamp}@example.com`,
      role: 'lawyer',
      specialization: 'Family Law',
      years_of_experience: 5,
      office_address: '123 Main St, New York',
      bio: 'Experienced lawyer',
      ...overrides
    });
  }

  static createClientData(overrides = {}) {
    const timestamp = this.generateTimestamp();
    return this.createUserData({
      full_name: 'Client User',
      email: `client${timestamp}@example.com`,
      role: 'client',
      ...overrides
    });
  }
}

class TestCaseFixture {
  static createCase(overrides = {}) {
    const timestamp = Date.now();
    return {
      title: overrides.title || `Test Case ${timestamp}`,
      description: overrides.description || 'This is a detailed description of a legal case that requires professional representation.',
      category: overrides.category || '507f1f77bcf86cd799439011',
      city: overrides.city || 'New York',
      budget: overrides.budget !== undefined ? overrides.budget : 5000,
      priority: overrides.priority || 'medium',
      status: overrides.status,
      ...overrides
    };
  }

  static createOpenCase(overrides = {}) {
    return this.createCase({ status: 'open', ...overrides });
  }
}

class TestOfferFixture {
  static createOffer(overrides = {}) {
    return {
      price: overrides.price !== undefined ? overrides.price : 4500,
      message: overrides.message || 'I am interested in this case and can provide excellent legal representation with years of experience.',
      delivery_time: overrides.delivery_time !== undefined ? overrides.delivery_time : 30,
      ...overrides
    };
  }

  static createPendingOffer(overrides = {}) {
    return this.createOffer({ status: 'pending', ...overrides });
  }
}

class TestCategoryFixture {
  static createCategory(overrides = {}) {
    const timestamp = Date.now();
    return {
      name: overrides.name || `CATEGORY_${timestamp}`,
      description: overrides.description || 'Test category for legal services',
      icon: overrides.icon || 'gavel',
      ...overrides
    };
  }
}

class ResponseHelper {
  static getData(response) {
    const body = response.body || {};
    if (body.data === undefined) return null;
    return body.data;
  }

  static getItems(response) {
    const data = this.getData(response);
    if (!data) return null;
    if (Array.isArray(data)) return data;
    return data.items || data.docs || data.data || null;
  }

  static getPagination(response) {
    const data = this.getData(response);
    if (!data) return null;
    return data.pagination || data.meta || data.pageInfo || null;
  }

  static getUser(response) {
    const data = this.getData(response);
    if (!data) return null;
    return data.user || data.profile || data || null;
  }

  static getRole(response) {
    const user = this.getUser(response);
    if (!user) return null;
    return user.role || null;
  }

  static getTokens(response) {
    const body = response.body || {};
    const data = body.data || body;
    
    return {
      accessToken: data.accessToken || data.token || data.tokens?.accessToken || null,
      refreshToken: data.refreshToken || data.tokens?.refreshToken || null
    };
  }

  static isSuccess(response) {
    return response.body?.success === true;
  }

  static getStatusCode(response) {
    return response.status;
  }
}

module.exports = {
  TestAuthHelper,
  TestUserFixture,
  TestCaseFixture,
  TestOfferFixture,
  TestCategoryFixture,
  ResponseHelper,
  DatabaseFixtures: require('./fixtures')
};