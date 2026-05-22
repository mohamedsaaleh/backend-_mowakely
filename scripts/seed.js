require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('../src/modules/users/users.model');
const { Client } = require('../src/modules/clients/clients.model');
const { Lawyer } = require('../src/modules/lawyers/lawyers.model');
const { Category } = require('../src/modules/categories/categories.model');
const { Case } = require('../src/modules/cases/cases.model');
const { Offer } = require('../src/modules/offers/offers.model');
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

const categories = [
  { name: 'Family Law' },
  { name: 'Criminal Defense' },
  { name: 'Corporate Law' },
  { name: 'Real Estate' },
  { name: 'Immigration' },
  { name: 'Personal Injury' },
  { name: 'Intellectual Property' },
  { name: 'Tax Law' },
  { name: 'Employment Law' },
  { name: 'Bankruptcy Law' }
];

const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle', 'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa', 'Timothy', 'Deborah', 'Ronald', 'Stephanie', 'Edward', 'Rebecca', 'Jason', 'Sharon', 'Jeffrey', 'Laura', 'Ryan', 'Cynthia', 'Jacob', 'Kathleen', 'Gary', 'Amy', 'Nicholas', 'Angela', 'Eric', 'Shirley', 'Jonathan', 'Anna', 'Stephen', 'Brenda', 'Larry', 'Pamela', 'Justin', 'Emma', 'Scott', 'Nicole', 'Brandon', 'Helen', 'Benjamin', 'Samantha', 'Samuel', 'Katherine', 'Raymond', 'Christine', 'Gregory', 'Debra', 'Frank', 'Rachel', 'Alexander', 'Carolyn', 'Janet', 'Jack', 'Catherine'];

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson', 'Watson', 'Brooks', 'Chavez', 'Wood', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez', 'Mason', 'Wang', 'Kumar', 'Singh', 'Weber', 'Ivanov', 'Sato', 'Chen', 'Kim'];

const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'Indianapolis', 'Seattle', 'Denver', 'Boston', 'El Paso', 'Nashville', 'Detroit', 'Portland', 'Las Vegas', 'Memphis', 'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento', 'Kansas City', 'Atlanta', 'Miami', 'Raleigh', 'Omaha', 'Long Beach', 'Virginia Beach', 'Oakland', 'Minneapolis', 'Tulsa', 'Arlington', 'Tampa', 'New Orleans'];

const specializations = ['Family Law', 'Criminal Defense', 'Corporate Law', 'Real Estate', 'Immigration', 'Personal Injury', 'Intellectual Property', 'Tax Law', 'Employment Law', 'Bankruptcy Law', 'Civil Litigation', 'Contract Law', 'Traffic Law', 'Estate Planning', 'Mediation'];

const lawyerBios = [
  'Experienced attorney with over 10 years of practice in',
  'Dedicated legal professional specializing in',
  'Passionate advocate for clients in matters related to',
  'Trusted advisor with expertise in',
  'Skilled litigator focused on',
  'Compassionate legal counsel experienced in',
  'Results-driven lawyer practicing',
  'Client-focused attorney specializing in'
];

const caseTitles = [
  'Divorce and Child Custody',
  'Business Incorporation',
  'Visa Application',
  'Criminal Defense',
  'Personal Injury Claim',
  'Contract Dispute',
  'Real Estate Transaction',
  'Employment Discrimination',
  'Immigration Status',
  'Intellectual Property',
  'Tax Evasion Case',
  'Bankruptcy Filing',
  'Medical Malpractice',
  'Product Liability',
  'Wrongful Termination'
];

const caseDescriptions = [
  'Urgent legal matter requiring immediate attention and professional representation.',
  'Complex case requiring experienced attorney with specific expertise in this area.',
  'Ongoing legal dispute that needs careful handling and strategic approach.',
  'Important legal matter affecting family and business interests.',
  'Time-sensitive case with approaching deadlines requiring prompt legal action.',
  'Multi-faceted legal issue involving multiple parties and complex regulations.',
  'Sensitive matter requiring discretion and professional legal counsel.',
  'Challenging case requiring innovative legal solutions and strong advocacy.'
];

const usedPhones = new Set();

function generatePhone() {
  let phone;
  do {
    phone = `+1-555-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`;
  } while (usedPhones.has(phone));
  usedPhones.add(phone);
  return phone;
}

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateBudget() {
  const budgets = [2000, 3000, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 50000];
  return randomElement(budgets);
}

async function seedAdmins(salt) {
  const adminEmails = ['admin@legalservices.com', 'superadmin@legalservices.com', 'support@legalservices.com'];
  const adminNames = ['System Admin', 'Super Admin', 'Support Admin'];
  
  const admins = [];
  for (let i = 0; i < adminEmails.length; i++) {
    const user = await User.create({
      email: adminEmails[i],
      password: await bcrypt.hash('Admin@123456', salt),
      role: 'admin',
      full_name: adminNames[i],
      phone: generatePhone(),
      is_verified: true
    });
    admins.push(user);
  }
  return admins;
}

async function seedLawyers(salt, count) {
  const lawyers = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const email = `lawyer_${firstName.toLowerCase()}_${lastName.toLowerCase()}_${i + 1}@lawyer.com`;
    
    try {
      const user = await User.create({
        email: email,
        password: await bcrypt.hash('Lawyer@123', salt),
        role: 'lawyer',
        full_name: `${firstName} ${lastName}`,
        phone: generatePhone(),
        city: randomElement(cities),
        bio: `${randomElement(lawyerBios)} ${randomElement(specializations)}. Contact for consultation.`,
        is_verified: true
      });

      const lawyerProfile = await Lawyer.create({
        user: user._id,
        specialization: randomElement(specializations),
        years_of_experience: Math.floor(Math.random() * 25) + 1,
        office_address: `${Math.floor(Math.random() * 9999) + 1} Legal Street, ${randomElement(cities)}`,
        rate: Math.floor(Math.random() * 400) + 50,
        availability_status: Math.random() > 0.2,
        total_reviews: Math.floor(Math.random() * 100),
        offers_count: Math.floor(Math.random() * 50)
      });

      lawyers.push({ user, lawyerProfile });
    } catch (err) {
      logger.warn(`Skipping lawyer ${i + 1}: ${err.message}`);
    }

    if ((i + 1) % 20 === 0) {
      logger.info(`Seeded ${i + 1}/${count} lawyers...`);
    }
  }
  
  return lawyers;
}

async function seedClients(salt, count) {
  const clients = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const email = `client_${firstName.toLowerCase()}_${lastName.toLowerCase()}_${i + 1}@email.com`;
    
    try {
      const user = await User.create({
        email: email,
        password: await bcrypt.hash('Client@123', salt),
        role: 'client',
        full_name: `${firstName} ${lastName}`,
        phone: generatePhone(),
        city: randomElement(cities),
        address: `${Math.floor(Math.random() * 9999) + 1} ${randomElement(['Main', 'Oak', 'Pine', 'Maple', 'Elm', 'Cedar', 'Walnut'])} ${randomElement(['Street', 'Avenue', 'Road', 'Boulevard', 'Lane'])}, ${randomElement(cities)}`,
        is_verified: true
      });

      const clientProfile = await Client.create({
        user: user._id
      });

      clients.push({ user, clientProfile });
    } catch (err) {
      logger.warn(`Skipping client ${i + 1}: ${err.message}`);
    }

    if ((i + 1) % 20 === 0) {
      logger.info(`Seeded ${i + 1}/${count} clients...`);
    }
  }
  
  return clients;
}

async function seedCases(savedCategories, clients, count) {
  const cases = [];
  
  for (let i = 0; i < count; i++) {
    const client = randomElement(clients);
    
    try {
      const legalCase = await Case.create({
        title: `${randomElement(caseTitles)} Case #${i + 1}`,
        description: randomElement(caseDescriptions),
        category: randomElement(savedCategories)._id,
        client: client.clientProfile._id,
        city: randomElement(cities),
        budget: generateBudget(),
        status: randomElement(['open', 'open', 'open', 'in_progress', 'completed']),
        offers_count: Math.floor(Math.random() * 10)
      });
      
      cases.push(legalCase);
    } catch (err) {
      logger.warn(`Skipping case ${i + 1}: ${err.message}`);
    }

    if ((i + 1) % 50 === 0) {
      logger.info(`Seeded ${i + 1}/${count} cases...`);
    }
  }
  
  return cases;
}

async function seedOffers(cases, lawyers, count) {
  const offers = [];
  const usedCombinations = new Set();
  
  for (let i = 0; i < count; i++) {
    const legalCase = randomElement(cases);
    const lawyer = randomElement(lawyers);
    const key = `${legalCase._id}-${lawyer.lawyerProfile._id}`;
    
    if (usedCombinations.has(key)) {
      continue;
    }
    usedCombinations.add(key);
    
    try {
      const offer = await Offer.create({
        case: legalCase._id,
        lawyer: lawyer.lawyerProfile._id,
        price: legalCase.budget * (0.7 + Math.random() * 0.5),
        delivery_time: Math.floor(Math.random() * 60) + 7,
        message: `I am interested in handling your ${legalCase.title.toLowerCase()} case. With my experience in ${lawyer.lawyerProfile.specialization}, I can provide quality legal representation.`,
        status: randomElement(['pending', 'pending', 'accepted', 'rejected']),
        applied_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
      });
      
      offers.push(offer);
    } catch (err) {
      logger.warn(`Skipping offer ${i + 1}: ${err.message}`);
    }

    if ((i + 1) % 50 === 0) {
      logger.info(`Seeded ${i + 1}/${count} offers...`);
    }
  }
  
  return offers;
}

const seedDatabase = async () => {
  try {
    await connectDB();

    logger.info('Starting database seeding with large dataset...');

    await User.deleteMany({});
    await Lawyer.deleteMany({});
    await Client.deleteMany({});
    await Category.deleteMany({});
    await Case.deleteMany({});
    await Offer.deleteMany({});

    logger.info('Cleared existing data');

    const savedCategories = await Category.insertMany(categories);
    logger.info(`Seeded ${savedCategories.length} categories`);

    const salt = await bcrypt.genSalt(12);

    const admins = await seedAdmins(salt);
    logger.info(`Seeded ${admins.length} admins`);

    const lawyers = await seedLawyers(salt, 80);
    logger.info(`Seeded ${lawyers.length} lawyers`);

    const clients = await seedClients(salt, 100);
    logger.info(`Seeded ${clients.length} clients`);

    const cases = await seedCases(savedCategories, clients, 150);
    logger.info(`Seeded ${cases.length} cases`);

    const offers = await seedOffers(cases, lawyers, 300);
    logger.info(`Seeded ${offers.length} offers`);

    logger.info(`
========================================
Database seeding completed successfully!
========================================

Admins (3):
  admin@legalservices.com | Admin@123456
  superadmin@legalservices.com | Admin@123456
  support@legalservices.com | Admin@123456

Lawyers: ${lawyers.length}
Clients: ${clients.length}
Categories: ${savedCategories.length}
Cases: ${cases.length}
Offers: ${offers.length}

Default Passwords:
  Lawyers: Lawyer@123
  Clients: Client@123
  Admins: Admin@123456

API Documentation: http://localhost:3000/api-docs
========================================
    `);

    process.exit(0);
  } catch (error) {
    logger.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();