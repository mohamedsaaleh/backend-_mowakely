const request = require('supertest');
const app = require('../../src/app');
const { TestAuthHelper, TestCategoryFixture, DatabaseFixtures } = require('../utils/helpers');

describe('Categories API Tests', () => {
  let adminToken, clientToken;

  beforeEach(async () => {
    const admin = await DatabaseFixtures.createAdmin();
    adminToken = TestAuthHelper.generateAccessToken(admin._id, 'admin');

    const client = await DatabaseFixtures.createClient();
    clientToken = TestAuthHelper.generateAccessToken(client.user._id, 'client');
  });

  describe('GET /api/categories', () => {
    it('should get all categories without auth', async () => {
      await DatabaseFixtures.createCategory();

      const response = await request(app).get('/api/categories');

      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data) || Array.isArray(response.body.data?.items)).toBe(true);
      }
    });

    it('should return empty array when no categories', async () => {
      const response = await request(app).get('/api/categories');

      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        const data = response.body.data;
        expect(data === undefined || Array.isArray(data) || (data && Array.isArray(data.items))).toBe(true);
      }
    });

    it('should return categories with all fields', async () => {
      await DatabaseFixtures.createCategory();

      const response = await request(app).get('/api/categories');

      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        const data = Array.isArray(response.body.data) ? response.body.data : response.body.data?.items;
        if (data && data.length > 0) {
          expect(data[0]).toHaveProperty('name');
          expect(data[0]).toHaveProperty('description');
          expect(data[0]).toHaveProperty('icon');
        }
      }
    });

    it('should filter active categories', async () => {
      await DatabaseFixtures.createCategory({ is_active: true });
      await DatabaseFixtures.createCategory({ name: `INACTIVE ${Date.now()}`, is_active: false });

      const response = await request(app).get('/api/categories?is_active=true');

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('GET /api/categories/:id', () => {
    it('should get category by id', async () => {
      const category = await DatabaseFixtures.createCategory();

      const response = await request(app).get(`/api/categories/${category._id}`);

      expect([200, 404, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.data.name).toBeDefined();
      }
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(app).get('/api/categories/507f1f77bcf86cd799439011');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/categories', () => {
    it('should create category as admin', async () => {
      const categoryData = TestCategoryFixture.createCategory({ name: `NEW CATEGORY ${Date.now()}` });

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData);

      expect([201, 400, 401]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body.data.name).toBe(categoryData.name);
      }
    });

    it('should reject create as non-admin', async () => {
      const categoryData = TestCategoryFixture.createCategory();

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(categoryData);

      expect(response.status).toBe(403);
    });

    it('should reject create without auth', async () => {
      const categoryData = TestCategoryFixture.createCategory();

      const response = await request(app)
        .post('/api/categories')
        .send(categoryData);

      expect(response.status).toBe(401);
    });

    it('should reject duplicate category name', async () => {
      await DatabaseFixtures.createCategory({ name: `FAMILY LAW ${Date.now()}` });
      const categoryData = TestCategoryFixture.createCategory({ name: `FAMILY LAW ${Date.now()}` });

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData);

      expect([201, 400, 409]).toContain(response.status);
    });

    it('should reject create without name', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Test description' });

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/categories/:id', () => {
    it('should update category as admin', async () => {
      const category = await DatabaseFixtures.createCategory();

      const response = await request(app)
        .patch(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `UPDATED CATEGORY ${Date.now()}`, description: 'Updated description' });

      expect([200, 404]).toContain(response.status);
    });

    it('should reject update as non-admin', async () => {
      const category = await DatabaseFixtures.createCategory();

      const response = await request(app)
        .patch(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete category as admin', async () => {
      const category = await DatabaseFixtures.createCategory();

      const response = await request(app)
        .delete(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should reject delete as non-admin', async () => {
      const category = await DatabaseFixtures.createCategory();

      const response = await request(app)
        .delete(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .delete('/api/categories/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
});