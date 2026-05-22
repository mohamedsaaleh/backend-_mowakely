const mongoose = require('mongoose');
const { Case, caseSchema } = require('../../../src/modules/cases/cases.model');

describe('Case Model Unit Tests', () => {
  describe('Schema Fields', () => {
    it('should have correct schema fields', () => {
      const fields = Object.keys(caseSchema.paths);
      expect(fields).toContain('client');
      expect(fields).toContain('lawyer');
      expect(fields).toContain('accepted_offer_id');
      expect(fields).toContain('category');
      expect(fields).toContain('title');
      expect(fields).toContain('description');
      expect(fields).toContain('city');
      expect(fields).toContain('status');
      expect(fields).toContain('budget');
      expect(fields).toContain('offers_count');
    });
  });

  describe('Status Enum Validation', () => {
    const validStatuses = ['open', 'in_progress', 'completed', 'cancelled'];

    it('should accept all valid statuses', async () => {
      for (const status of validStatuses) {
        const caseObj = new Case({
          title: 'Test Case',
          description: 'Test description',
          city: 'New York',
          category: new mongoose.Types.ObjectId(),
          budget: 5000,
          status,
          client: new mongoose.Types.ObjectId()
        });

        const error = await caseObj.validate();
        expect(error).toBeUndefined();
      }
    });

    it('should reject invalid status', () => {
      const caseObj = new Case({
        title: 'Test Case',
        description: 'Test description',
        city: 'New York',
        category: new mongoose.Types.ObjectId(),
        budget: 5000,
        status: 'invalid_status',
        client: new mongoose.Types.ObjectId()
      });

      const validationError = caseObj.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.status).toBeDefined();
    });
  });

  describe('Required Fields', () => {
    it('should require title', () => {
      const caseObj = new Case({
        description: 'Test description',
        city: 'New York',
        category: new mongoose.Types.ObjectId(),
        budget: 5000,
        client: new mongoose.Types.ObjectId()
      });

      const validationError = caseObj.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.title).toBeDefined();
    });

    it('should require description', () => {
      const caseObj = new Case({
        title: 'Test Case',
        city: 'New York',
        category: new mongoose.Types.ObjectId(),
        budget: 5000,
        client: new mongoose.Types.ObjectId()
      });

      const validationError = caseObj.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.description).toBeDefined();
    });

    it('should require city', () => {
      const caseObj = new Case({
        title: 'Test Case',
        description: 'Test description',
        category: new mongoose.Types.ObjectId(),
        budget: 5000,
        client: new mongoose.Types.ObjectId()
      });

      const validationError = caseObj.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.city).toBeDefined();
    });

    it('should require category', () => {
      const caseObj = new Case({
        title: 'Test Case',
        description: 'Test description',
        city: 'New York',
        budget: 5000,
        client: new mongoose.Types.ObjectId()
      });

      const validationError = caseObj.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.category).toBeDefined();
    });

    it('should require client', () => {
      const caseObj = new Case({
        title: 'Test Case',
        description: 'Test description',
        city: 'New York',
        category: new mongoose.Types.ObjectId(),
        budget: 5000
      });

      const validationError = caseObj.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.client).toBeDefined();
    });
  });

  describe('Default Values', () => {
    it('should set status to open by default', async () => {
      const caseObj = new Case({
        title: 'Test Case',
        description: 'Test description',
        city: 'New York',
        category: new mongoose.Types.ObjectId(),
        budget: 5000,
        client: new mongoose.Types.ObjectId()
      });

      await caseObj.save();
      expect(caseObj.status).toBe('open');
    });

    it('should set offers_count to 0 by default', async () => {
      const caseObj = new Case({
        title: 'Test Case',
        description: 'Test description',
        city: 'New York',
        category: new mongoose.Types.ObjectId(),
        budget: 5000,
        client: new mongoose.Types.ObjectId()
      });

      await caseObj.save();
      expect(caseObj.offers_count).toBe(0);
    });

    it('should set lawyer to null by default', async () => {
      const caseObj = new Case({
        title: 'Test Case',
        description: 'Test description',
        city: 'New York',
        category: new mongoose.Types.ObjectId(),
        budget: 5000,
        client: new mongoose.Types.ObjectId()
      });

      await caseObj.save();
      expect(caseObj.lawyer).toBeNull();
    });

    it('should set accepted_offer_id to null by default', async () => {
      const caseObj = new Case({
        title: 'Test Case',
        description: 'Test description',
        city: 'New York',
        category: new mongoose.Types.ObjectId(),
        budget: 5000,
        client: new mongoose.Types.ObjectId()
      });

      await caseObj.save();
      expect(caseObj.accepted_offer_id).toBeNull();
    });
  });

  describe('Budget Validation', () => {
    it('should accept valid budget (>= 2000)', async () => {
      const caseObj = new Case({
        title: 'Test Case',
        description: 'Test description',
        city: 'New York',
        category: new mongoose.Types.ObjectId(),
        budget: 5000,
        client: new mongoose.Types.ObjectId()
      });

      const error = await caseObj.validate();
      expect(error).toBeUndefined();
    });

    it('should reject budget below 2000', () => {
      const caseObj = new Case({
        title: 'Test Case',
        description: 'Test description',
        city: 'New York',
        category: new mongoose.Types.ObjectId(),
        budget: 500,
        client: new mongoose.Types.ObjectId()
      });

      const validationError = caseObj.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.budget).toBeDefined();
    });

    it('should accept budget exactly at minimum (2000)', async () => {
      const caseObj = new Case({
        title: 'Test Case',
        description: 'Test description',
        city: 'New York',
        category: new mongoose.Types.ObjectId(),
        budget: 2000,
        client: new mongoose.Types.ObjectId()
      });

      const error = await caseObj.validate();
      expect(error).toBeUndefined();
    });
  });

  describe('Relationship Fields', () => {
    it('should have client as ObjectId reference to Client', () => {
      const clientPath = caseSchema.paths.client;
      expect(clientPath.instance).toBe('ObjectId');
      expect(clientPath.options.ref).toBe('Client');
    });

    it('should have lawyer as ObjectId reference to Lawyer', () => {
      const lawyerPath = caseSchema.paths.lawyer;
      expect(lawyerPath.instance).toBe('ObjectId');
      expect(lawyerPath.options.ref).toBe('Lawyer');
    });

    it('should have category as ObjectId reference to Category', () => {
      const categoryPath = caseSchema.paths.category;
      expect(categoryPath.instance).toBe('ObjectId');
      expect(categoryPath.options.ref).toBe('Category');
    });

    it('should have accepted_offer_id as ObjectId reference to Offer', () => {
      const offerPath = caseSchema.paths.accepted_offer_id;
      expect(offerPath.instance).toBe('ObjectId');
      expect(offerPath.options.ref).toBe('Offer');
    });
  });

  describe('Index Creation', () => {
    it('should create status index', () => {
      const statusIndex = caseSchema.indexes().find(idx => 
        idx[0] && idx[0].status
      );
      expect(statusIndex).toBeDefined();
    });

    it('should create category index', () => {
      const categoryIndex = caseSchema.indexes().find(idx => 
        idx[0] && idx[0].category
      );
      expect(categoryIndex).toBeDefined();
    });

    it('should create client index', () => {
      const clientIndex = caseSchema.indexes().find(idx => 
        idx[0] && idx[0].client
      );
      expect(clientIndex).toBeDefined();
    });

    it('should create lawyer index', () => {
      const lawyerIndex = caseSchema.indexes().find(idx => 
        idx[0] && idx[0].lawyer
      );
      expect(lawyerIndex).toBeDefined();
    });

    it('should create created_at index (descending)', () => {
      const createdAtIndex = caseSchema.indexes().find(idx => 
        idx[0] && idx[0].created_at && idx[0].created_at === -1
      );
      expect(createdAtIndex).toBeDefined();
    });

    it('should create text index on title and description', () => {
      const textIndex = caseSchema.indexes().find(idx => 
        idx[0] && idx[0].title === 'text'
      );
      expect(textIndex).toBeDefined();
    });
  });

  describe('Timestamp Fields', () => {
    it('should use created_at instead of createdAt', () => {
      const fields = Object.keys(caseSchema.paths);
      expect(fields).toContain('created_at');
      expect(fields).not.toContain('createdAt');
    });

    it('should use updated_at instead of updatedAt', () => {
      const fields = Object.keys(caseSchema.paths);
      expect(fields).toContain('updated_at');
      expect(fields).not.toContain('updatedAt');
    });
  });

  describe('Field Constraints', () => {
    it('should enforce max length on title', () => {
      const caseObj = new Case({
        title: 'a'.repeat(201),
        description: 'Test description',
        city: 'New York',
        category: new mongoose.Types.ObjectId(),
        budget: 5000,
        client: new mongoose.Types.ObjectId()
      });

      const validationError = caseObj.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.title).toBeDefined();
    });

    it('should accept title at max length', async () => {
      const caseObj = new Case({
        title: 'a'.repeat(200),
        description: 'Test description',
        city: 'New York',
        category: new mongoose.Types.ObjectId(),
        budget: 5000,
        client: new mongoose.Types.ObjectId()
      });

      const error = await caseObj.validate();
      expect(error).toBeUndefined();
    });

    it('should trim city whitespace', async () => {
      const caseObj = new Case({
        title: 'Test Case',
        description: 'Test description',
        city: '  New York  ',
        category: new mongoose.Types.ObjectId(),
        budget: 5000,
        client: new mongoose.Types.ObjectId()
      });

      await caseObj.save();
      expect(caseObj.city).toBe('New York');
    });

    it('should trim title whitespace', async () => {
      const caseObj = new Case({
        title: '  Test Case  ',
        description: 'Test description',
        city: 'New York',
        category: new mongoose.Types.ObjectId(),
        budget: 5000,
        client: new mongoose.Types.ObjectId()
      });

      await caseObj.save();
      expect(caseObj.title).toBe('Test Case');
    });
  });
});