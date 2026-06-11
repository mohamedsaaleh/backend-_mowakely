require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('../src/modules/users/users.model');
const { Client } = require('../src/modules/clients/clients.model');
const { Lawyer } = require('../src/modules/lawyers/lawyers.model');
const { Category } = require('../src/modules/categories/categories.model');
const { Case } = require('../src/modules/cases/cases.model');
const { Offer } = require('../src/modules/offers/offers.model');
const { Role } = require('../src/modules/roles/roles.model');
const { AuditLog } = require('../src/modules/audit/audit.model');
const logger = require('../src/utils/logger');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/legal_marketplace';
    await mongoose.connect(mongoUri);
    logger.info('Database connected for seeding');
  } catch (error) {
    logger.error('Database connection error:', error);
    process.exit(1);
  }
};

async function seedAdmins(salt) {
  const adminEmail = 'superadmin@legalservices.com';
  const adminName = 'Super Admin';
  const adminRole = 'superadmin';
  const adminPassword = 'Admin@123456';
  
  const user = await User.create({
    email: adminEmail,
    password: adminPassword,
    role: adminRole,
    full_name: adminName,
    phone: '+1-555-0000',
    is_verified: true,
    isSuperAdmin: true,
    permissions: ['*']
  });
  return [user];
}

const seedDatabase = async () => {
  try {
    await connectDB();

    logger.info('Starting database seeding...');

    await User.deleteMany({});
    await Lawyer.deleteMany({});
    await Client.deleteMany({});
    await Category.deleteMany({});
    await Case.deleteMany({});
    await Offer.deleteMany({});
    await Role.deleteMany({});
    await AuditLog.deleteMany({});

    logger.info('Cleared existing data');

    const salt = await bcrypt.genSalt(12);

    const admins = await seedAdmins(salt);
    logger.info(`Seeded ${admins.length} admins`);

    logger.info(`
========================================
Database seeding completed successfully!
========================================

Super Admin Account:
  Email: superadmin@legalservices.com
  Password: Admin@123456

========================================
    `);

    process.exit(0);
  } catch (error) {
    logger.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();