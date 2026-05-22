const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('../../src/modules/users/users.model');
const { Lawyer } = require('../../src/modules/lawyers/lawyers.model');
const { Client } = require('../../src/modules/clients/clients.model');
const { Category } = require('../../src/modules/categories/categories.model');
const { Case } = require('../../src/modules/cases/cases.model');
const { Offer } = require('../../src/modules/offers/offers.model');
const { RefreshToken } = require('../../src/modules/refresh-tokens/refresh-tokens.model');

class DatabaseFixtures {
  static async createUser(userData = {}) {
    const timestamp = Date.now() + Math.random().toString(36).substr(2, 5);
    const defaultUser = {
      full_name: 'Test User',
      email: `test${timestamp}@example.com`,
      password: 'Test@123456',
      role: 'client',
      phone: `+1555${timestamp.slice(-7)}`
    };

    const user = new User({ ...defaultUser, ...userData });
    await user.save();
    return user;
  }

  static async createAdmin(overrides = {}) {
    const timestamp = Date.now() + Math.random().toString(36).substr(2, 5);
    return this.createUser({
      full_name: 'Admin User',
      email: `admin${timestamp}@example.com`,
      role: 'admin',
      phone: `+1555${timestamp.slice(-7)}`,
      ...overrides
    });
  }

  static async createLawyer(overrides = {}) {
    const timestamp = Date.now() + Math.random().toString(36).substr(2, 5);
    const user = await this.createUser({
      full_name: 'Lawyer User',
      email: `lawyer${timestamp}@example.com`,
      role: 'lawyer',
      ...(overrides.user || {})
    });

    const lawyerProfile = new Lawyer({
      user: user._id,
      specialization: overrides.profile?.specialization || 'Family Law',
      years_of_experience: overrides.profile?.years_of_experience || 5,
      office_address: overrides.profile?.office_address || '123 Main St, New York',
      bio: 'Experienced lawyer specializing in family law cases.',
      rate: 150,
      availability_status: true,
      total_reviews: 0,
      offers_count: 0,
      ...(overrides.profile || {})
    });
    await lawyerProfile.save();

    return { user, profile: lawyerProfile };
  }

  static async createClient(overrides = {}) {
    const timestamp = Date.now() + Math.random().toString(36).substr(2, 5);
    const user = await this.createUser({
      full_name: 'Client User',
      email: `client${timestamp}@example.com`,
      role: 'client',
      ...(overrides.user || {})
    });

    const clientProfile = new Client({
      user: user._id,
      city: 'New York',
      address: '456 Client Ave',
      ...(overrides.profile || {})
    });
    await clientProfile.save();

    return { user, profile: clientProfile };
  }

  static async createLawyers(count = 5) {
    const lawyers = [];
    const specializations = ['Family Law', 'Criminal Law', 'Corporate Law'];
    for (let i = 0; i < count; i++) {
      const lawyer = await this.createLawyer({
        user: {
          full_name: `Lawyer ${i}`,
          email: `lawyer${i}${Date.now()}${Math.random().toString(36).substr(2, 5)}@example.com`
        },
        profile: {
          specialization: specializations[i % specializations.length]
        }
      });
      lawyers.push(lawyer);
    }
    return lawyers;
  }

  static async createClients(count = 5) {
    const clients = [];
    for (let i = 0; i < count; i++) {
      const client = await this.createClient({
        user: {
          full_name: `Client ${i}`,
          email: `client${i}${Date.now()}${Math.random().toString(36).substr(2, 5)}@example.com`
        }
      });
      clients.push(client);
    }
    return clients;
  }

  static async createCategory(categoryData = {}) {
    const timestamp = Date.now() + Math.random().toString(36).substr(2, 5);
    const name = categoryData.name || `CATEGORY_${timestamp}`;
    
    const existing = await Category.findOne({ name });
    if (existing) {
      return existing;
    }

    const defaultCategory = {
      name,
      description: 'Test category for legal cases',
      icon: 'gavel',
      is_active: true
    };

    const category = new Category({ ...defaultCategory, ...categoryData });
    await category.save();
    return category;
  }

  static async createCategories(count = 8) {
    const categoriesData = [
      { name: 'FAMILY_LAW', description: 'Family law cases', icon: 'family_restroom' },
      { name: 'CRIMINAL_DEFENSE', description: 'Criminal defense cases', icon: 'gavel' },
      { name: 'CORPORATE_LAW', description: 'Corporate law cases', icon: 'business' },
      { name: 'REAL_ESTATE', description: 'Real estate cases', icon: 'home_work' },
      { name: 'IMMIGRATION', description: 'Immigration cases', icon: 'flight' },
      { name: 'PERSONAL_INJURY', description: 'Personal injury cases', icon: 'healing' },
      { name: 'INTELLECTUAL_PROPERTY', description: 'IP cases', icon: 'lightbulb' },
      { name: 'TAX_LAW', description: 'Tax law cases', icon: 'account_balance' }
    ];

    const categories = [];
    for (let i = 0; i < Math.min(count, categoriesData.length); i++) {
      const uniqueName = `${categoriesData[i].name}_${Date.now()}_${i}`;
      const category = await this.createCategory({ ...categoriesData[i], name: uniqueName });
      categories.push(category);
    }
    return categories;
  }

  static async ensureDefaultCategories() {
    return this.createCategories(8);
  }

  static async createCase(caseData = {}, client) {
    if (!client) {
      client = await this.createClient();
    }

    const category = await this.createCategory();
    const timestamp = Date.now();

    const defaultCase = {
      title: `Test Case ${timestamp}`,
      description: 'This is a detailed description of the legal case that needs representation.',
      category: category._id,
      city: 'New York',
      budget: 5000,
      status: 'open',
      priority: 'medium',
      client: client.profile._id
    };

    const caseObj = new Case({ ...defaultCase, ...caseData });
    await caseObj.save();
    return { case: caseObj, client, category };
  }

  static async createCases(count = 5, client) {
    if (!client) {
      client = await this.createClient();
    }

    const categories = await this.createCategories();
    const cases = [];

    const statuses = ['open', 'in_progress', 'completed', 'cancelled'];

    for (let i = 0; i < count; i++) {
      const category = categories[i % categories.length];
      const caseObj = await this.createCase({
        title: `Test Case ${i}`,
        category: category._id,
        status: statuses[i % statuses.length],
        budget: 1000 + (i * 1000)
      }, client);
      cases.push(caseObj);
    }
    return cases;
  }

  static async createOffer(offerData = {}, lawyer, caseObj) {
    if (!lawyer) {
      lawyer = await this.createLawyer();
    }

    if (!caseObj) {
      const caseData = await this.createCase();
      caseObj = caseData.case;
    }

    const defaultOffer = {
      case: caseObj._id,
      lawyer: lawyer.profile._id,
      price: 4500,
      message: 'I am interested in handling this case. Please review my proposal.',
      delivery_time: 30,
      status: 'pending'
    };

    const offer = new Offer({ ...defaultOffer, ...offerData });
    await offer.save();
    return { offer, lawyer, case: caseObj };
  }

  static async createOffers(count = 5, caseObj) {
    const lawyers = await this.createLawyers(count);
    const offers = [];

    for (let i = 0; i < Math.min(count, lawyers.length); i++) {
      const offerData = await this.createOffer({
        price: 4000 + (i * 500),
        status: i === 0 ? 'accepted' : 'pending'
      }, lawyers[i], caseObj);
      offers.push(offerData);
    }
    return offers;
  }

  static async createRefreshToken(user, tokenValue) {
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(tokenValue).digest('hex');

    const refreshToken = new RefreshToken({
      user: user._id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: 'test-agent',
      ipAddress: '127.0.0.1',
      isRevoke: false
    });
    await refreshToken.save();
    return refreshToken;
  }

  static async createCompleteScenario() {
    const categories = await this.createCategories();
    const lawyer = await this.createLawyer();
    const client = await this.createClient();
    const caseData = await this.createCase({
      category: categories[0]._id
    }, client);

    await this.createOffers(3, caseData.case);

    return {
      categories,
      lawyer,
      client,
      case: caseData.case
    };
  }

  static async cleanDatabase() {
    await User.deleteMany({});
    await Lawyer.deleteMany({});
    await Client.deleteMany({});
    await Category.deleteMany({});
    await Case.deleteMany({});
    await Offer.deleteMany({});
    await RefreshToken.deleteMany({});
  }
}

module.exports = DatabaseFixtures;