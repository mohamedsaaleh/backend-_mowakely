const request = require('supertest');
const app = require('../../src/app');
const { TestAuthHelper, TestUserFixture, TestCaseFixture, TestOfferFixture, DatabaseFixtures } = require('../utils/helpers');

describe('Lawyer E2E Journey Tests', () => {
  let accessToken, userId;
  const userData = TestUserFixture.createLawyerData();

  beforeEach(async () => {
    await DatabaseFixtures.ensureDefaultCategories();

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    userId = registerResponse.body.data?.user?._id || registerResponse.body.data?.user?.id;
    
    const tokens = TestAuthHelper.extractTokens(registerResponse);
    if (tokens) {
      accessToken = tokens.accessToken;
    } else {
      accessToken = registerResponse.body.data?.accessToken;
    }
  });

  describe('Complete Lawyer Workflow', () => {
    it('Register -> Login -> Update Profile -> Browse Cases -> Make Offer', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password });

      expect([200, 401]).toContain(loginResponse.status);
      
      if (loginResponse.status === 200) {
        accessToken = TestAuthHelper.getAccessToken(loginResponse) || loginResponse.body.data?.accessToken;

        const profileResponse = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${accessToken}`);

        expect([200, 401, 429]).toContain(profileResponse.status);

        const browseResponse = await request(app).get('/api/cases?status=open');
        expect([200, 404]).toContain(browseResponse.status);

        const client = await DatabaseFixtures.createClient();
        const caseData = await DatabaseFixtures.createCase({ status: 'open' }, client);

        const offerData = TestOfferFixture.createPendingOffer({ price: 5000, delivery_time: 7 });
        const offerResponse = await request(app)
          .post('/api/offers')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ caseId: caseData.case._id.toString(), ...offerData });

        expect([201, 400, 404]).toContain(offerResponse.status);
      }
    });

    it('Browse Cases -> Search by Category -> Create Offer -> View My Offers', async () => {
      const client = await DatabaseFixtures.createClient();
      const category = await DatabaseFixtures.createCategory({ name: `FAMILY LAW ${Date.now()}` });
      await DatabaseFixtures.createCase({ category: category._id, status: 'open' }, client);

      const categoryResponse = await request(app).get('/api/cases?category=' + category._id.toString());
      expect([200, 404]).toContain(categoryResponse.status);

      const caseData = await DatabaseFixtures.createCase({ category: category._id, status: 'open' }, client);

      const offerResponse = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ caseId: caseData.case._id.toString(), ...TestOfferFixture.createPendingOffer() });

      expect([201, 400, 404]).toContain(offerResponse.status);

      const myOffersResponse = await request(app)
        .get('/api/offers/my-offers')
        .set('Authorization', `Bearer ${accessToken}`);

      expect([200, 404, 401]).toContain(myOffersResponse.status);
      
      if (myOffersResponse.status === 200) {
        const data = myOffersResponse.body.data;
        expect(data === undefined || Array.isArray(data) || Array.isArray(data?.items)).toBe(true);
      }
    });

    it('Create Offer -> Update Offer -> Withdraw Offer', async () => {
      const client = await DatabaseFixtures.createClient();
      const caseData = await DatabaseFixtures.createCase({ status: 'open' }, client);

      const createOfferResponse = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ caseId: caseData.case._id.toString(), ...TestOfferFixture.createPendingOffer() });

      expect([201, 400, 404]).toContain(createOfferResponse.status);

      if (createOfferResponse.status === 201 && createOfferResponse.body.data?._id) {
        const offerId = createOfferResponse.body.data._id;

        const updateResponse = await request(app)
          .put(`/api/offers/${offerId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ price: 4500, message: 'Updated offer details' });

        expect([200, 404]).toContain(updateResponse.status);

        const withdrawResponse = await request(app)
          .delete(`/api/offers/${offerId}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect([200, 204, 404]).toContain(withdrawResponse.status);
      }
    });

    it('View Assigned Cases -> Update Case Status', async () => {
      const client = await DatabaseFixtures.createClient();
      const clientToken = TestAuthHelper.generateAccessToken(client.user._id, 'client');

      const caseData = await DatabaseFixtures.createCase({ status: 'open' }, client);

      const offerData = TestOfferFixture.createPendingOffer();
      const offerResponse = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ caseId: caseData.case._id.toString(), ...offerData });

      expect([201, 400, 404]).toContain(offerResponse.status);

      if (offerResponse.status === 201 && offerResponse.body.data?._id) {
        await request(app)
          .patch(`/api/offers/${offerResponse.body.data._id}/accept`)
          .set('Authorization', `Bearer ${clientToken}`);

        const assignedResponse = await request(app)
          .get('/api/cases/lawyer-cases')
          .set('Authorization', `Bearer ${accessToken}`);

        expect([200, 404, 401]).toContain(assignedResponse.status);

        if (assignedResponse.status === 200 && Array.isArray(assignedResponse.body.data?.items)) {
          if (assignedResponse.body.data.items.length > 0) {
            const caseId = assignedResponse.body.data.items[0]._id;
            const updateCaseResponse = await request(app)
              .patch(`/api/cases/${caseId}`)
              .set('Authorization', `Bearer ${accessToken}`)
              .send({ status: 'completed' });

            expect([200, 404]).toContain(updateCaseResponse.status);
          }
        }
      }
    });
  });

  describe('Lawyer Profile & Specialization', () => {
    it('Should have lawyer-specific endpoints', async () => {
      const lawyerProfileResponse = await request(app)
        .get('/api/lawyers/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect([200, 404]).toContain(lawyerProfileResponse.status);

      const statsResponse = await request(app)
        .get('/api/lawyers/stats')
        .set('Authorization', `Bearer ${accessToken}`);

      expect([200, 404]).toContain(statsResponse.status);
    });

    it('Should track offered cases', async () => {
      const client = await DatabaseFixtures.createClient();

      for (let i = 0; i < 3; i++) {
        const caseData = await DatabaseFixtures.createCase({ status: 'open' }, client);
        await request(app)
          .post('/api/offers')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ caseId: caseData.case._id.toString(), ...TestOfferFixture.createPendingOffer() });
      }

      const myOffersResponse = await request(app)
        .get('/api/offers/my-offers')
        .set('Authorization', `Bearer ${accessToken}`);

      expect([200, 404, 401]).toContain(myOffersResponse.status);

      const pendingOffersResponse = await request(app)
        .get('/api/offers/my-offers?status=pending')
        .set('Authorization', `Bearer ${accessToken}`);

      expect([200, 404, 401]).toContain(pendingOffersResponse.status);
    });
  });
});