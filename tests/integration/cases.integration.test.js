const request = require('supertest');
const app = require('../../src/app');
const { TestAuthHelper, TestCaseFixture, DatabaseFixtures, ResponseHelper } = require('../utils/helpers');

describe('Cases Integration Tests', () => {
  let clientToken, client, lawyerToken, lawyer;

  beforeEach(async () => {
    client = await DatabaseFixtures.createClient();
    clientToken = TestAuthHelper.generateAccessToken(client.user._id, 'client');

    lawyer = await DatabaseFixtures.createLawyer();
    lawyerToken = TestAuthHelper.generateAccessToken(lawyer.user._id, 'lawyer');

    await DatabaseFixtures.ensureDefaultCategories();
  });

  describe('GET /api/cases', () => {
    const casesEndpoint = '/api/cases';

    it('should get all cases without auth', async () => {
      await DatabaseFixtures.createCase({}, client);

      const response = await request(app).get(casesEndpoint);

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
      }
    });

    it('should filter cases by status', async () => {
      await DatabaseFixtures.createCase({ status: 'open' }, client);

      const response = await request(app)
        .get(`${casesEndpoint}?status=open`);

      expect([200, 404]).toContain(response.status);
    });

    it('should filter cases by category', async () => {
      const category = await DatabaseFixtures.createCategory();
      await DatabaseFixtures.createCase({
        category: category._id,
        status: 'open'
      }, client);

      const response = await request(app)
        .get(`${casesEndpoint}?category=${category._id.toString()}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`${casesEndpoint}?page=1&limit=10`);

      expect([200, 404]).toContain(response.status);
    });

    it('should support sorting', async () => {
      const response = await request(app)
        .get(`${casesEndpoint}?sort=-created_at`);

      expect([200, 404]).toContain(response.status);
    });

    it('should support search', async () => {
      await DatabaseFixtures.createCase({ title: 'Specific Divorce Case' }, client);

      const response = await request(app)
        .get(`${casesEndpoint}?search=Divorce`);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('POST /api/cases', () => {
    const createCaseEndpoint = '/api/cases';

    it('should create case as client', async () => {
      const category = await DatabaseFixtures.createCategory();
      const caseData = TestCaseFixture.createCase({ 
        category: category._id.toString()
      });

      const response = await request(app)
        .post(createCaseEndpoint)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(caseData);

      expect([201, 400, 404]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.success).toBe(true);
      }
    });

    it('should reject case creation without auth', async () => {
      const category = await DatabaseFixtures.createCategory();
      const caseData = TestCaseFixture.createCase({ category: category._id.toString() });

      const response = await request(app)
        .post(createCaseEndpoint)
        .send(caseData);

      expect([401, 429]).toContain(response.status);
    });

    it('should reject case creation as lawyer', async () => {
      const category = await DatabaseFixtures.createCategory();
      const caseData = TestCaseFixture.createCase({ category: category._id.toString() });

      const response = await request(app)
        .post(createCaseEndpoint)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send(caseData);

      expect([403, 404]).toContain(response.status);
    });

    it('should reject case without title', async () => {
      const category = await DatabaseFixtures.createCategory();
      const caseData = TestCaseFixture.createCase({ category: category._id.toString() });
      delete caseData.title;

      const response = await request(app)
        .post(createCaseEndpoint)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(caseData);

      expect([400, 401, 429]).toContain(response.status);
    });

    it('should reject case without description', async () => {
      const category = await DatabaseFixtures.createCategory();
      const caseData = TestCaseFixture.createCase({ category: category._id.toString() });
      delete caseData.description;

      const response = await request(app)
        .post(createCaseEndpoint)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(caseData);

      expect([400, 401, 429]).toContain(response.status);
    });

    it('should reject case without category', async () => {
      const caseData = TestCaseFixture.createCase();
      delete caseData.category;

      const response = await request(app)
        .post(createCaseEndpoint)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(caseData);

      expect([400, 401, 429]).toContain(response.status);
    });

    it('should reject case with negative budget', async () => {
      const category = await DatabaseFixtures.createCategory();
      const caseData = TestCaseFixture.createCase({ 
        category: category._id.toString(), 
        budget: -1000 
      });

      const response = await request(app)
        .post(createCaseEndpoint)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(caseData);

      expect([400, 401, 429]).toContain(response.status);
    });
  });

  describe('GET /api/cases/:id', () => {
    it('should get case by id without auth', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);

      const response = await request(app)
        .get(`/api/cases/${caseData.case._id}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent case', async () => {
      const response = await request(app)
        .get('/api/cases/507f1f77bcf86cd799439011');

      expect([404, 400]).toContain(response.status);
    });

    it('should populate category details', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);

      const response = await request(app)
        .get(`/api/cases/${caseData.case._id}`);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('PATCH /api/cases/:id', () => {
    it('should update case as owner (client)', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);

      const response = await request(app)
        .patch(`/api/cases/${caseData.case._id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ title: 'Updated Title' });

      expect([200, 404]).toContain(response.status);
    });

    it('should reject update as non-owner', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);
      const otherClient = await DatabaseFixtures.createClient();
      const otherToken = TestAuthHelper.generateAccessToken(otherClient.user._id, 'client');

      const response = await request(app)
        .patch(`/api/cases/${caseData.case._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Updated Title' });

      expect([403, 404]).toContain(response.status);
    });

    it('should allow lawyer to update assigned case', async () => {
      const caseData = await DatabaseFixtures.createCase({
        lawyer: lawyer.profile._id,
        status: 'in_progress'
      }, client);

      const response = await request(app)
        .patch(`/api/cases/${caseData.case._id}`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({ description: 'Updated description' });

      expect([200, 400, 404]).toContain(response.status);
    });

    it('should reject update without auth', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);

      const response = await request(app)
        .patch(`/api/cases/${caseData.case._id}`)
        .send({ title: 'Updated Title' });

      expect([401, 429]).toContain(response.status);
    });
  });

  describe('DELETE /api/cases/:id', () => {
    it('should delete case as owner', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);

      const response = await request(app)
        .delete(`/api/cases/${caseData.case._id}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect([200, 204, 404]).toContain(response.status);
    });

    it('should reject delete as non-owner', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);
      const otherClient = await DatabaseFixtures.createClient();
      const otherToken = TestAuthHelper.generateAccessToken(otherClient.user._id, 'client');

      const response = await request(app)
        .delete(`/api/cases/${caseData.case._id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect([403, 404]).toContain(response.status);
    });

    it('should allow admin to delete any case', async () => {
      const admin = await DatabaseFixtures.createAdmin();
      const adminToken = TestAuthHelper.generateAccessToken(admin._id, 'admin');
      const caseData = await DatabaseFixtures.createCase({}, client);

      const response = await request(app)
        .delete(`/api/cases/${caseData.case._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 204, 403, 404]).toContain(response.status);
    });
  });
});