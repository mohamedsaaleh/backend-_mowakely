const mongoose = require('mongoose');
const { Lawyer, lawyerSchema } = require('../../../src/modules/lawyers/lawyers.model');

describe('Lawyer Model Unit Tests', () => {
  describe('Schema Fields', () => {
    it('should have correct schema fields', () => {
      const fields = Object.keys(lawyerSchema.paths);
      expect(fields).toContain('user');
      expect(fields).toContain('specialization');
      expect(fields).toContain('years_of_experience');
      expect(fields).toContain('office_address');
      expect(fields).toContain('availability_status');
      expect(fields).toContain('rate');
      expect(fields).toContain('total_reviews');
      expect(fields).toContain('offers_count');
      expect(fields).toContain('subscription_id');
    });

    it('should have correct field types', () => {
      const userPath = lawyerSchema.paths.user;
      const specializationPath = lawyerSchema.paths.specialization;
      const yearsPath = lawyerSchema.paths.years_of_experience;
      const ratePath = lawyerSchema.paths.rate;

      expect(userPath.instance).toBe('ObjectId');
      expect(specializationPath.instance).toBe('String');
      expect(yearsPath.instance).toBe('Number');
      expect(ratePath.instance).toBe('Number');
    });
  });

  describe('Default Values', () => {
    it('should set availability_status to true by default', async () => {
      const lawyer = new Lawyer({
        user: new mongoose.Types.ObjectId(),
        specialization: 'Family Law'
      });

      await lawyer.save();
      expect(lawyer.availability_status).toBe(true);
    });

    it('should set rate to 0 by default', async () => {
      const lawyer = new Lawyer({
        user: new mongoose.Types.ObjectId(),
        specialization: 'Family Law'
      });

      await lawyer.save();
      expect(lawyer.rate).toBe(0);
    });

    it('should set total_reviews to 0 by default', async () => {
      const lawyer = new Lawyer({
        user: new mongoose.Types.ObjectId(),
        specialization: 'Family Law'
      });

      await lawyer.save();
      expect(lawyer.total_reviews).toBe(0);
    });

    it('should set offers_count to 0 by default', async () => {
      const lawyer = new Lawyer({
        user: new mongoose.Types.ObjectId(),
        specialization: 'Family Law'
      });

      await lawyer.save();
      expect(lawyer.offers_count).toBe(0);
    });

    it('should set years_of_experience to 0 by default', async () => {
      const lawyer = new Lawyer({
        user: new mongoose.Types.ObjectId(),
        specialization: 'Family Law'
      });

      await lawyer.save();
      expect(lawyer.years_of_experience).toBe(0);
    });
  });

  describe('Required Fields', () => {
    it('should require user reference', () => {
      const lawyer = new Lawyer({
        specialization: 'Family Law'
      });

      const validationError = lawyer.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.user).toBeDefined();
    });

    it('should require specialization', () => {
      const lawyer = new Lawyer({
        user: new mongoose.Types.ObjectId()
      });

      const validationError = lawyer.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.specialization).toBeDefined();
    });
  });

  describe('Validation', () => {
    it('should accept valid lawyer data', () => {
      const lawyer = new Lawyer({
        user: new mongoose.Types.ObjectId(),
        specialization: 'Family Law',
        years_of_experience: 10,
        office_address: '123 Main St, New York',
        rate: 150
      });

      const validationError = lawyer.validateSync();
      expect(validationError).toBeUndefined();
    });

    it('should reject negative years_of_experience', () => {
      const lawyer = new Lawyer({
        user: new mongoose.Types.ObjectId(),
        specialization: 'Family Law',
        years_of_experience: -1
      });

      const validationError = lawyer.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.years_of_experience).toBeDefined();
    });

    it('should reject negative rate', () => {
      const lawyer = new Lawyer({
        user: new mongoose.Types.ObjectId(),
        specialization: 'Family Law',
        rate: -50
      });

      const validationError = lawyer.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.rate).toBeDefined();
    });

    it('should reject negative total_reviews', () => {
      const lawyer = new Lawyer({
        user: new mongoose.Types.ObjectId(),
        specialization: 'Family Law',
        total_reviews: -1
      });

      const validationError = lawyer.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.total_reviews).toBeDefined();
    });
  });

  describe('Relationship Fields', () => {
    it('should have user as ObjectId reference to User', () => {
      const userPath = lawyerSchema.paths.user;
      expect(userPath.options.ref).toBe('User');
    });

    it('should have subscription_id as ObjectId reference to Subscription', () => {
      const subPath = lawyerSchema.paths.subscription_id;
      expect(subPath.options.ref).toBe('Subscription');
    });

    it('should allow null subscription_id', () => {
      const lawyer = new Lawyer({
        user: new mongoose.Types.ObjectId(),
        specialization: 'Family Law'
      });

      const validationError = lawyer.validateSync();
      expect(validationError).toBeUndefined();
    });
  });

  describe('String Field Constraints', () => {
    it('should trim specialization whitespace', async () => {
      const lawyer = new Lawyer({
        user: new mongoose.Types.ObjectId(),
        specialization: '  Family Law  '
      });

      await lawyer.save();
      expect(lawyer.specialization).toBe('Family Law');
    });

    it('should trim office_address whitespace', async () => {
      const lawyer = new Lawyer({
        user: new mongoose.Types.ObjectId(),
        specialization: 'Family Law',
        office_address: '  123 Main St  '
      });

      await lawyer.save();
      expect(lawyer.office_address).toBe('123 Main St');
    });
  });

  describe('Index Creation', () => {
    it('should create availability_status index', () => {
      const index = lawyerSchema.indexes().find(idx => 
        idx[0] && idx[0].availability_status
      );
      expect(index).toBeDefined();
    });

    it('should create specialization index', () => {
      const index = lawyerSchema.indexes().find(idx => 
        idx[0] && idx[0].specialization
      );
      expect(index).toBeDefined();
    });

    it('should create rate index (descending for sorting by rate)', () => {
      const index = lawyerSchema.indexes().find(idx => 
        idx[0] && idx[0].rate && idx[0].rate === -1
      );
      expect(index).toBeDefined();
    });

    it('should create total_reviews index (descending)', () => {
      const index = lawyerSchema.indexes().find(idx => 
        idx[0] && idx[0].total_reviews && idx[0].total_reviews === -1
      );
      expect(index).toBeDefined();
    });
  });

  describe('Unique Constraints', () => {
    it('should enforce unique user reference', async () => {
      const userId = new mongoose.Types.ObjectId();

      const lawyer1 = new Lawyer({
        user: userId,
        specialization: 'Family Law'
      });
      await lawyer1.save();

      const lawyer2 = new Lawyer({
        user: userId,
        specialization: 'Criminal Law'
      });

      try {
        await lawyer2.save();
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe(11000);
      }
    });
  });

  describe('Timestamp Fields', () => {
    it('should use created_at instead of createdAt', () => {
      const fields = Object.keys(lawyerSchema.paths);
      expect(fields).toContain('created_at');
      expect(fields).not.toContain('createdAt');
    });

    it('should use updated_at instead of updatedAt', () => {
      const fields = Object.keys(lawyerSchema.paths);
      expect(fields).toContain('updated_at');
      expect(fields).not.toContain('updatedAt');
    });
  });
});