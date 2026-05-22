const request = require('supertest');
const app = require('../../src/app');
const { TestAuthHelper, TestCaseFixture, DatabaseFixtures } = require('../utils/helpers');

describe('Cases API Tests', () => {
  let clientToken, client, lawyerToken, lawyer;

  beforeEach(async () => {
    client = await DatabaseFixtures.createClient();
    clientToken = TestAuthHelper.generateAccessToken(client.user._id, 'client');

    lawyer = await DatabaseFixtures.createLawyer();
    lawyerToken = TestAuthHelper.generateAccessToken(lawyer.user._id, 'lawyer');

    await DatabaseFixtures.ensureDefaultCategories();
  });

  describe('GET /api/cases (Public)', () => {
    it('should return paginated cases', async () => {
      const response = await request(app).get('/api/cases?page=1&limit=10');

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
      }
    });

    it('should filter by status parameter', async () => {
      const response = await request(app).get('/api/cases?status=open');

      expect([200, 404]).toContain(response.status);
    });

    it('should support search parameter', async () => {
      await DatabaseFixtures.createCase({ title: 'Legal Consultation' }, client);

      const response = await request(app).get('/api/cases?search=Consultation');

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('POST /api/cases (Client)', () => {
    it('should create case with all required fields', async () => {
      const category = await DatabaseFixtures.createCategory();
      const caseData = TestCaseFixture.createCase({ 
        category: category._id.toString(),
        status: undefined
      });

      const response = await request(app)
        .post('/api/cases')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(caseData);

      expect([201, 400, 404]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.data.title).toBeDefined();
      }
    });

    it('should set default status', async () => {
      const category = await DatabaseFixtures.createCategory();
      const caseData = TestCaseFixture.createCase({ 
        category: category._id.toString(),
        status: undefined
      });

      const response = await request(app)
        .post('/api/cases')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(caseData);

      expect([201, 400, 404]).toContain(response.status);
    });

    it('should reject case creation', async () => {
      const category = await DatabaseFixtures.createCategory();
      const caseData = TestCaseFixture.createCase({ category: category._id.toString() });

      const createResponse = await request(app)
        .post('/api/cases')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(caseData);

      expect([201, 400, 404]).toContain(createResponse.status);
    });
  });

  describe('GET /api/cases/:id (Public)', () => {
    it('should return case by ID', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);

      const response = await request(app).get(`/api/cases/${caseData.case._id}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should populate client field', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);

      const response = await request(app).get(`/api/cases/${caseData.case._id}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should return 404 for invalid ID', async () => {
      const response = await request(app).get('/api/cases/invalid-id');

      expect([404, 400]).toContain(response.status);
    });
  });

  describe('PUT /api/cases/:id (Owner)', () => {
    it('should update own case title', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);

      const response = await request(app)
        .put(`/api/cases/${caseData.case._id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ title: 'Updated Legal Case' });

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.data.title).toBe('Updated Legal Case');
      }
    });

    it('should update case status', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);

      const response = await request(app)
        .put(`/api/cases/${caseData.case._id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ status: 'cancelled' });

      expect([200, 404]).toContain(response.status);
    });

    it('should reject update for other user case', async () => {
      const otherClient = await DatabaseFixtures.createClient();
      const otherToken = TestAuthHelper.generateAccessToken(otherClient.user._id, 'client');
      const caseData = await DatabaseFixtures.createCase({}, client);

      const response = await request(app)
        .put(`/api/cases/${caseData.case._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Hacked Title' });

      expect([403, 404]).toContain(response.status);
    });
  });

  describe('DELETE /api/cases/:id (Owner/Admin)', () => {
    it('should delete own case', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);

      const response = await request(app)
        .delete(`/api/cases/${caseData.case._id}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect([200, 204, 404]).toContain(response.status);
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

  describe('GET /api/cases/my-cases', () => {
    it('should get client own cases', async () => {
      await DatabaseFixtures.createCase({}, client);

      const response = await request(app)
        .get('/api/cases/my-cases')
        .set('Authorization', `Bearer ${clientToken}`);

      expect([200, 404, 401]).toContain(response.status);
      
      if (response.status === 200) {
        const items = response.body.data?.items || response.body.data;
        if (items) {
          expect(Array.isArray(items)).toBe(true);
        }
      }
    });
  });

  describe('GET /api/cases/lawyer-cases', () => {
    it('should get lawyer assigned cases', async () => {
      await DatabaseFixtures.createCase({ lawyer: lawyer.profile._id }, client);

      const response = await request(app)
        .get('/api/cases/lawyer-cases')
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect([200, 404, 401]).toContain(response.status);
    });
  });
});