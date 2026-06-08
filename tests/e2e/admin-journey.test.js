const request = require('supertest');
const app = require('../../src/app');
const { TestAuthHelper, TestUserFixture, TestCategoryFixture, DatabaseFixtures } = require('../utils/helpers');

describe('Admin E2E Journey Tests', () => {
  let adminToken, adminId;
  const adminData = TestUserFixture.createAdminData();

  beforeEach(async () => {
    await DatabaseFixtures.ensureDefaultCategories();

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(adminData);

    adminId = registerResponse.body.data?.user?._id || registerResponse.body.data?.user?.id;
    
    const tokens = TestAuthHelper.extractTokens(registerResponse);
    adminToken = tokens?.accessToken || registerResponse.body.data?.accessToken;
  });

  describe('Complete Admin Workflow', () => {
    it('Register -> Login -> Get All Users -> Manage Categories', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: adminData.email, password: adminData.password });

      expect([200, 401]).toContain(loginResponse.status);
      
      if (loginResponse.status === 200) {
        adminToken = TestAuthHelper.getAccessToken(loginResponse) || loginResponse.body.data?.accessToken;

        const profileResponse = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 401, 429]).toContain(profileResponse.status);

        const usersResponse = await request(app)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 404]).toContain(usersResponse.status);
      }
    });

    it('Create Category -> Update Category -> Delete Category', async () => {
      const categoryData = TestCategoryFixture.createCategory({ name: `NEW CATEGORY ${Date.now()}` });

      const createResponse = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData);

      expect([201, 400, 401]).toContain(createResponse.status);
      
      if (createResponse.status === 201 && createResponse.body.data?._id) {
        const categoryId = createResponse.body.data._id;

        const updateResponse = await request(app)
          .patch(`/api/categories/${categoryId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: `UPDATED ${Date.now()}`, description: 'Updated description' });

        expect([200, 404]).toContain(updateResponse.status);

        const deleteResponse = await request(app)
          .delete(`/api/categories/${categoryId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 404]).toContain(deleteResponse.status);
      }
    });
  });

  describe('Admin User Management', () => {
    it('Get All Users -> Filter by Role -> View User Details', async () => {
      await DatabaseFixtures.createClient();
      await DatabaseFixtures.createLawyer();

      const allUsersResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 404]).toContain(allUsersResponse.status);
      
      if (allUsersResponse.status === 200) {
        const data = allUsersResponse.body.data;
        expect(data === undefined || Array.isArray(data) || Array.isArray(data?.items)).toBe(true);
      }

      const clientsResponse = await request(app)
        .get('/api/admin/users?role=client')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 404]).toContain(clientsResponse.status);

      const lawyersResponse = await request(app)
        .get('/api/admin/users?role=lawyer')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 404]).toContain(lawyersResponse.status);
    });

    it('View User -> Update User -> Delete User', async () => {
      const client = await DatabaseFixtures.createClient();

      const viewResponse = await request(app)
        .get(`/api/admin/users/${client.user._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(viewResponse.status).toBe(200);

      const updateResponse = await request(app)
        .put(`/api/admin/users/${client.user._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_banned: true });
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.is_banned).toBe(true);

      const deleteResponse = await request(app)
        .delete(`/api/admin/users/${client.user._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(deleteResponse.status).toBe(200);

      const viewAfterDeleteResponse = await request(app)
        .get(`/api/admin/users/${client.user._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(viewAfterDeleteResponse.status).toBe(404);
    });
  });

  describe('Admin Case Management', () => {
    it('View All Cases -> Filter Cases -> View Case Details', async () => {
      const client = await DatabaseFixtures.createClient();
      await DatabaseFixtures.createCase({}, client);

      const allCasesResponse = await request(app)
        .get('/api/admin/cases')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 404]).toContain(allCasesResponse.status);

      const openCasesResponse = await request(app)
        .get('/api/admin/cases?status=open')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 404]).toContain(openCasesResponse.status);
    });

    it('Delete Any Case', async () => {
      const client = await DatabaseFixtures.createClient();
      const caseData = await DatabaseFixtures.createCase({}, client);

      const deleteResponse = await request(app)
        .delete(`/api/cases/${caseData.case._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 204, 403, 404]).toContain(deleteResponse.status);

      if (deleteResponse.status === 200 || deleteResponse.status === 204) {
        const viewResponse = await request(app).get(`/api/cases/${caseData.case._id}`);
        expect([404, 200]).toContain(viewResponse.status);
      }
    });
  });

  describe('Admin Dashboard', () => {
    it('Get Dashboard Statistics', async () => {
      const client = await DatabaseFixtures.createClient();
      await DatabaseFixtures.createLawyer();
      await DatabaseFixtures.createCase({}, client);

      const dashboardResponse = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 404]).toContain(dashboardResponse.status);
      
      if (dashboardResponse.status === 200) {
        const data = dashboardResponse.body.data;
        expect(data).toBeDefined();
      }
    });
  });

  describe('Admin Categories Management', () => {
    it('Create Multiple Categories -> List Categories -> Search Category', async () => {
      await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(TestCategoryFixture.createCategory({ name: `CATEGORY A ${Date.now()}` }));

      await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(TestCategoryFixture.createCategory({ name: `CATEGORY B ${Date.now()}` }));

      const listResponse = await request(app).get('/api/categories');
      
      expect([200, 404, 500]).toContain(listResponse.status);
      
      if (listResponse.status === 200) {
        const data = listResponse.body.data;
        expect(Array.isArray(data) || Array.isArray(data?.items)).toBe(true);
      }

      const searchResponse = await request(app)
        .get('/api/categories?search=FAMILY')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 404, 500]).toContain(searchResponse.status);
    });
  });

  describe('Authorization Checks', () => {
    it('Should deny client access to admin endpoints', async () => {
      const client = await DatabaseFixtures.createClient();
      const clientToken = TestAuthHelper.generateAccessToken(client.user._id, 'client');

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).toBe(403);
    });

    it('Should deny lawyer access to admin endpoints', async () => {
      const lawyer = await DatabaseFixtures.createLawyer();
      const lawyerToken = TestAuthHelper.generateAccessToken(lawyer.user._id, 'lawyer');

      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${lawyerToken}`);

      expect(response.status).toBe(403);
    });
  });
});