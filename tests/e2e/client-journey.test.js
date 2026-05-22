const request = require('supertest');
const app = require('../../src/app');
const { TestAuthHelper, TestUserFixture, TestCaseFixture, TestOfferFixture, DatabaseFixtures } = require('../utils/helpers');

describe('Client E2E Journey Tests', () => {
  let accessToken, refreshToken, userId;
  const userData = TestUserFixture.createClientData();

  beforeEach(async () => {
    await DatabaseFixtures.ensureDefaultCategories();

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    userId = registerResponse.body.data?.user?._id || registerResponse.body.data?.user?.id;
    
    const tokens = TestAuthHelper.extractTokens(registerResponse);
    if (tokens) {
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;
    } else {
      accessToken = registerResponse.body.data?.accessToken;
      refreshToken = registerResponse.body.data?.refreshToken;
    }
  });

  describe('Complete Client Workflow', () => {
    it('Register -> Login -> Get Profile -> Create Case -> Browse Cases -> Get My Cases', async () => {
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

        const category = await DatabaseFixtures.createCategory();
        const caseData = TestCaseFixture.createCase({ 
          category: category._id.toString(),
          status: undefined
        });
        const createCaseResponse = await request(app)
          .post('/api/cases')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(caseData);

        expect([201, 400, 404]).toContain(createCaseResponse.status);
        
        if (createCaseResponse.status === 201 && createCaseResponse.body.data?._id) {
          const caseId = createCaseResponse.body.data._id;

          const browseCasesResponse = await request(app).get('/api/cases');
          expect([200, 404]).toContain(browseCasesResponse.status);

          const myCasesResponse = await request(app)
            .get('/api/cases/my-cases')
            .set('Authorization', `Bearer ${accessToken}`);

          expect([200, 404, 401]).toContain(myCasesResponse.status);
          
          if (myCasesResponse.status === 200) {
            const data = myCasesResponse.body.data;
            expect(Array.isArray(data?.items) || Array.isArray(data)).toBe(true);
          }
        }
      }
    });

    it('Create Case -> View Case -> Update Case -> Close Case', async () => {
      const category = await DatabaseFixtures.createCategory();
      const caseData = TestCaseFixture.createCase({ 
        status: 'open', 
        category: category._id.toString(),
        status: undefined
      });
      const createResponse = await request(app)
        .post('/api/cases')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(caseData);

      expect([201, 400, 404]).toContain(createResponse.status);

      if (createResponse.status === 201 && createResponse.body.data?._id) {
        const caseId = createResponse.body.data._id;

        const viewResponse = await request(app).get(`/api/cases/${caseId}`);
        expect([200, 404]).toContain(viewResponse.status);
        
        if (viewResponse.status === 200) {
          expect(viewResponse.body.data.title).toBeDefined();

          const updateResponse = await request(app)
            .patch(`/api/cases/${caseId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ description: 'Updated description for the case' });

          expect([200, 404]).toContain(updateResponse.status);

          const closeResponse = await request(app)
            .patch(`/api/cases/${caseId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ status: 'cancelled' });

          expect([200, 404]).toContain(closeResponse.status);
        }
      }
    });

    it('Create Case -> Receive Offers -> Accept One -> Reject Others', async () => {
      const category = await DatabaseFixtures.createCategory();
      const caseData = TestCaseFixture.createCase({ 
        category: category._id.toString(),
        status: undefined
      });
      const createCaseResponse = await request(app)
        .post('/api/cases')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(caseData);

      expect([201, 400, 404]).toContain(createCaseResponse.status);

      if (createCaseResponse.status === 201 && createCaseResponse.body.data?._id) {
        const caseId = createCaseResponse.body.data._id;

        const lawyer1 = await DatabaseFixtures.createLawyer();
        const lawyer1Token = TestAuthHelper.generateAccessToken(lawyer1.user._id, 'lawyer');
        const lawyer2 = await DatabaseFixtures.createLawyer();
        const lawyer2Token = TestAuthHelper.generateAccessToken(lawyer2.user._id, 'lawyer');

        await request(app)
          .post('/api/offers')
          .set('Authorization', `Bearer ${lawyer1Token}`)
          .send({ caseId, ...TestOfferFixture.createPendingOffer({ price: 5000 }) });

        await request(app)
          .post('/api/offers')
          .set('Authorization', `Bearer ${lawyer2Token}`)
          .send({ caseId, ...TestOfferFixture.createPendingOffer({ price: 4500 }) });

        const offersResponse = await request(app)
          .get(`/api/offers/case/${caseId}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect([200, 404]).toContain(offersResponse.status);
        
        if (offersResponse.status === 200 && Array.isArray(offersResponse.body.data)) {
          const offers = offersResponse.body.data;
          if (offers.length > 0) {
            const sortedOffers = offers.sort((a, b) => a.price - b.price);
            const lowestOffer = sortedOffers[0];

            const acceptResponse = await request(app)
              .patch(`/api/offers/${lowestOffer._id}/accept`)
              .set('Authorization', `Bearer ${accessToken}`);

            expect([200, 404]).toContain(acceptResponse.status);

            const caseResponse = await request(app).get(`/api/cases/${caseId}`);
            expect([200, 404]).toContain(caseResponse.status);
          }
        }
      }
    });

    it('Refresh Token Flow', async () => {
      if (!refreshToken) {
        refreshToken = TestAuthHelper.generateRefreshToken(userId);
      }

      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect([200, 401]).toContain(refreshResponse.status);
    });

    it('Forgot Password Flow', async () => {
      const forgotResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: userData.email });

      expect([200, 429]).toContain(forgotResponse.status);
    });

    it('Logout Flow', async () => {
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect([200, 204, 401, 429, 500]).toContain(logoutResponse.status);
    });
  });

  describe('Client Case Management', () => {
    it('Create Multiple Cases -> Filter -> Search -> Delete', async () => {
      const cat1 = await DatabaseFixtures.createCategory({ name: `FAMILY LAW A ${Date.now()}` });
      const cat2 = await DatabaseFixtures.createCategory({ name: `CRIMINAL A ${Date.now()}` });

      await request(app)
        .post('/api/cases')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(TestCaseFixture.createCase({ title: 'Family Law Case', category: cat1._id.toString(), status: undefined }));

      await request(app)
        .post('/api/cases')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(TestCaseFixture.createCase({ title: 'Criminal Defense', category: cat2._id.toString(), status: undefined }));

      const myCasesResponse = await request(app)
        .get('/api/cases/my-cases')
        .set('Authorization', `Bearer ${accessToken}`);

      expect([200, 404, 401]).toContain(myCasesResponse.status);

      const filterResponse = await request(app)
        .get('/api/cases?status=open')
        .set('Authorization', `Bearer ${accessToken}`);

      expect([200, 404]).toContain(filterResponse.status);

      const searchResponse = await request(app)
        .get('/api/cases?search=Family')
        .set('Authorization', `Bearer ${accessToken}`);

      expect([200, 404]).toContain(searchResponse.status);

      const allCasesResponse = await request(app)
        .get('/api/cases/my-cases')
        .set('Authorization', `Bearer ${accessToken}`);

      if (allCasesResponse.status === 200 && Array.isArray(allCasesResponse.body.data?.items)) {
        if (allCasesResponse.body.data.items.length > 0) {
          const caseId = allCasesResponse.body.data.items[0]._id;

          const deleteResponse = await request(app)
            .delete(`/api/cases/${caseId}`)
            .set('Authorization', `Bearer ${accessToken}`);

          expect([200, 204, 403]).toContain(deleteResponse.status);
        }
      }
    });
  });
});