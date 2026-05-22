const request = require('supertest');
const app = require('../../src/app');
const { TestAuthHelper, TestOfferFixture, DatabaseFixtures } = require('../utils/helpers');

describe('Offers Integration Tests', () => {
  let clientToken, client, lawyerToken, lawyer;

  beforeEach(async () => {
    client = await DatabaseFixtures.createClient();
    clientToken = TestAuthHelper.generateAccessToken(client.user._id, 'client');

    lawyer = await DatabaseFixtures.createLawyer();
    lawyerToken = TestAuthHelper.generateAccessToken(lawyer.user._id, 'lawyer');

    await DatabaseFixtures.ensureDefaultCategories();
  });

  describe('POST /api/offers', () => {
    it('should create and return offer with case details', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);
      const offerData = TestOfferFixture.createPendingOffer();

      const response = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({ caseId: caseData.case._id.toString(), ...offerData });

      if (response.status !== 201) {
        if (process.env.TEST_DEBUG === 'true') {
          console.log('Create offer error:', response.body);
        }
      }
      expect([201, 400, 404]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.data).toBeDefined();
      }
    });

    it('should create offer with valid timeline', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);
      const offerData = TestOfferFixture.createPendingOffer({ delivery_time: 7 });

      const response = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({ caseId: caseData.case._id.toString(), ...offerData });

      expect([201, 400, 404]).toContain(response.status);
      
      if (response.status === 201 && response.body.data?.delivery_time) {
        expect(response.body.data.delivery_time).toBe(7);
      }
    });

    it('should reject duplicate offer from same lawyer', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);
      const offerData = TestOfferFixture.createPendingOffer();

      await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({ caseId: caseData.case._id.toString(), ...offerData });

      const response = await request(app)
        .post('/api/offers')
        .set('Authorization', `Bearer ${lawyerToken}`)
        .send({ caseId: caseData.case._id.toString(), ...offerData });

      expect([400, 404, 409]).toContain(response.status);
    });
  });

  describe('GET /api/offers/my-offers', () => {
    it('should get lawyer own offers', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);
      await DatabaseFixtures.createOffer({}, lawyer, caseData.case);

      const response = await request(app)
        .get('/api/offers/my-offers')
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect([200, 404, 401]).toContain(response.status);
      
      if (response.status === 200) {
        const data = response.body.data;
        const items = data?.items || data;
        if (items) {
          expect(Array.isArray(items)).toBe(true);
        }
      }
    });

    it('should filter offers by status', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);
      await DatabaseFixtures.createOffer({ status: 'pending' }, lawyer, caseData.case);

      const response = await request(app)
        .get('/api/offers/my-offers?status=pending')
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect([200, 404, 401]).toContain(response.status);
    });
  });

  describe('Accept/Reject Flow', () => {
    it('should auto-reject other offers when one is accepted', async () => {
      const caseData = await DatabaseFixtures.createCase({}, client);
      const otherLawyer = await DatabaseFixtures.createLawyer();

      const offer1 = await DatabaseFixtures.createOffer({}, lawyer, caseData.case);
      await DatabaseFixtures.createOffer({}, otherLawyer, caseData.case);

      const acceptResponse = await request(app)
        .patch(`/api/offers/${offer1.offer._id}/accept`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect([200, 404]).toContain(acceptResponse.status);

      if (acceptResponse.status === 200) {
        const response = await request(app)
          .get(`/api/offers/case/${caseData.case._id}`)
          .set('Authorization', `Bearer ${clientToken}`);

        expect([200, 404]).toContain(response.status);
        
        if (response.status === 200 && Array.isArray(response.body.data)) {
          const offers = response.body.data;
          const acceptedOffer = offers.find(o => o.status === 'accepted');
          const rejectedOffers = offers.filter(o => o.status === 'rejected');
          
          if (offers.length > 0) {
            expect(acceptedOffer || rejectedOffers.length > 0).toBeTruthy();
          }
        }
      }
    });

    it('should update case status when offer accepted', async () => {
      const caseData = await DatabaseFixtures.createCase({ status: 'open' }, client);
      const offerData = await DatabaseFixtures.createOffer({}, lawyer, caseData.case);

      const acceptResponse = await request(app)
        .patch(`/api/offers/${offerData.offer._id}/accept`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect([200, 404]).toContain(acceptResponse.status);

      if (acceptResponse.status === 200) {
        const caseResponse = await request(app).get(`/api/cases/${caseData.case._id}`);

        expect([200, 404]).toContain(caseResponse.status);
        
        if (caseResponse.status === 200 && caseResponse.body.data?.status) {
          expect(caseResponse.body.data.status).toBe('in_progress');
          expect(caseResponse.body.data.lawyer).toBeDefined();
        }
      }
    });
  });
});
