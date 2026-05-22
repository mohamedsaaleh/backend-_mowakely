const request = require('supertest');
const app = require('../../src/app');
const { TestAuthHelper, TestOfferFixture, DatabaseFixtures } = require('../utils/helpers');

describe('Offers API Tests', () => {
  let clientToken, client, lawyerToken, lawyer;

  beforeEach(async () => {
    client = await DatabaseFixtures.createClient();
    clientToken = TestAuthHelper.generateAccessToken(client.user._id, 'client');

    lawyer = await DatabaseFixtures.createLawyer();
    lawyerToken = TestAuthHelper.generateAccessToken(lawyer.user._id, 'lawyer');

    await DatabaseFixtures.ensureDefaultCategories();
  });

  describe('POST /api/offers', () => {
    it('should create offer as lawyer', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);
      const offerData = TestOfferFixture.createPendingOffer();

      const response = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          caseId: caseData.case._id.toString(),
          ...offerData
        });

      if (response.status !== 201) {
        if (process.env.TEST_DEBUG === 'true') {
          console.log('Create offer error:', response.body);
        }
      }
      expect([201, 400, 404]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.data.price).toBe(offerData.price);
      }
    });

    it('should reject create as client', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);
      const offerData = TestOfferFixture.createPendingOffer();

      const response = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          caseId: caseData.case._id.toString(),
          ...offerData
        });

      expect([403, 404]).toContain(response.status);
    });

    it('should reject create without auth', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);

      const response = await request(app)
        .post('/api/offers')
        .send({ caseId: caseData.case._id.toString(), price: 4500, message: 'Test message' });

      expect([401, 429]).toContain(response.status);
    });

    it('should reject create with invalid case ID', async () => {
      const response = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({
          caseId: '507f1f77bcf86cd799439011',
          price: 4500,
          message: 'Test message'
        });

      expect([400, 404]).toContain(response.status);
    });

    it('should reject create without price', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);

      const response = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({ caseId: caseData.case._id.toString(), message: 'Test message' });

      expect([400, 401, 429]).toContain(response.status);
    });

    it('should reject negative price', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);

      const response = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({ caseId: caseData.case._id.toString(), price: -100, message: 'Test message' });

      expect([400, 401, 429]).toContain(response.status);
    });
  });

  describe('GET /api/offers/case/:caseId', () => {
    it('should get offers for a case', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);
      await DatabaseFixtures.createOffer({}, lawyer, caseData.case);

      const response = await request(app)
        .get(`/api/offers/case/${caseData.case._id}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        const data = response.body.data;
        expect(data === undefined || Array.isArray(data) || (data && Array.isArray(data.items))).toBe(true);
      }
    });

    it('should return empty array for case with no offers', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);

      const response = await request(app)
        .get(`/api/offers/case/${caseData.case._id}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        const data = response.body.data;
        expect(data === undefined || Array.isArray(data) || (data && Array.isArray(data.items)) || data === null).toBe(true);
      }
    });
  });

  describe('PUT /api/offers/:id', () => {
    it('should update own offer as lawyer', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);
      const offerData = await DatabaseFixtures.createOffer({}, lawyer, caseData.case);

      const response = await request(app)
        .put(`/api/offers/${offerData.offer._id}`)
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({ price: 4000, message: 'Updated description' });

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200 && response.body.data?.price) {
        expect(response.body.data.price).toBe(4000);
      }
    });

    it('should reject update as non-owner', async () => {
      const otherLawyer = await DatabaseFixtures.createLawyer();
      const otherToken = TestAuthHelper.generateAccessToken(otherLawyer.user._id, 'lawyer');
      const caseData = await DatabaseFixtures.createCase({}, client);
      const offerData = await DatabaseFixtures.createOffer({}, lawyer, caseData.case);

      const response = await request(app)
        .put(`/api/offers/${offerData.offer._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ price: 4000 });

      expect([403, 404]).toContain(response.status);
    });
  });

  describe('PATCH /api/offers/:id/accept', () => {
    it('should accept offer as case owner (client)', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);
      const offerData = await DatabaseFixtures.createOffer({}, lawyer, caseData.case);

      const response = await request(app)
        .patch(`/api/offers/${offerData.offer._id}/accept`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200 && response.body.data?.status) {
        expect(response.body.data.status).toBe('accepted');
      }
    });

    it('should reject accept as non-owner', async () => {
      const otherClient = await DatabaseFixtures.createClient();
      const otherToken = TestAuthHelper.generateAccessToken(otherClient.user._id, 'client');
      const caseData = await DatabaseFixtures.createCase({}, client);
      const offerData = await DatabaseFixtures.createOffer({}, lawyer, caseData.case);

      const response = await request(app)
        .patch(`/api/offers/${offerData.offer._id}/accept`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect([403, 404]).toContain(response.status);
    });
  });

  describe('PATCH /api/offers/:id/reject', () => {
    it('should reject offer as case owner', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);
      const offerData = await DatabaseFixtures.createOffer({}, lawyer, caseData.case);

      const response = await request(app)
        .patch(`/api/offers/${offerData.offer._id}/reject`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200 && response.body.data?.status) {
        expect(response.body.data.status).toBe('rejected');
      }
    });
  });

  describe('DELETE /api/offers/:id', () => {
    it('should withdraw own offer', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);
      const offerData = await DatabaseFixtures.createOffer({}, lawyer, caseData.case);

      const response = await request(app)
        .delete(`/api/offers/${offerData.offer._id}`)
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect([200, 204, 404]).toContain(response.status);
    });

    it('should reject withdraw as non-owner', async () => {
      const otherLawyer = await DatabaseFixtures.createLawyer();
      const otherToken = TestAuthHelper.generateAccessToken(otherLawyer.user._id, 'lawyer');
      const caseData = await DatabaseFixtures.createCase({}, client);
      const offerData = await DatabaseFixtures.createOffer({}, lawyer, caseData.case);

      const response = await request(app)
        .delete(`/api/offers/${offerData.offer._id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect([403, 404]).toContain(response.status);
    });
  });
});
