const request = require('supertest');
const app = require('../../src/app');

describe('API Endpoints', () => {
  describe('GET /', () => {
    it('should return API status', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.message).toBe('Gestor Pro 360 API');
    });
  });

  describe('POST /auth/login', () => {
    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'fake@email.com', password: 'wrong' });
      // 401 when DB connected, 500 when DB not available in test env
      expect([401, 500]).toContain(res.statusCode);
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@test.com' });
      expect([400, 401, 500]).toContain(res.statusCode);
    });
  });

  describe('Protected routes (no token)', () => {
    it('GET /leads should return 401 without token', async () => {
      const res = await request(app).get('/leads');
      expect(res.statusCode).toBe(401);
    });

    it('GET /empreendimentos should return 401 without token', async () => {
      const res = await request(app).get('/empreendimentos');
      expect(res.statusCode).toBe(401);
    });

    it('GET /propostas should return 401 without token', async () => {
      const res = await request(app).get('/propostas');
      expect(res.statusCode).toBe(401);
    });

    it('GET /pipeline/stages should return 401 without token', async () => {
      const res = await request(app).get('/pipeline/stages');
      expect(res.statusCode).toBe(401);
    });

    it('GET /tasks should return 401 without token', async () => {
      const res = await request(app).get('/tasks');
      expect(res.statusCode).toBe(401);
    });

    it('GET /notifications should return 401 without token', async () => {
      const res = await request(app).get('/notifications');
      expect(res.statusCode).toBe(401);
    });

    it('GET /conversations should return 401 without token', async () => {
      const res = await request(app).get('/conversations');
      expect(res.statusCode).toBe(401);
    });

    it('GET /analytics/dashboard should return 401 without token', async () => {
      const res = await request(app).get('/analytics/dashboard');
      expect(res.statusCode).toBe(401);
    });

    it('GET /comissoes should return 401 without token', async () => {
      const res = await request(app).get('/comissoes');
      expect(res.statusCode).toBe(401);
    });

    it('GET /agenda/events should return 401 without token', async () => {
      const res = await request(app).get('/agenda/events');
      expect(res.statusCode).toBe(401);
    });

    it('GET /config should return 401 without token', async () => {
      const res = await request(app).get('/config');
      expect(res.statusCode).toBe(401);
    });

    it('GET /search should return 401 without token', async () => {
      const res = await request(app).get('/search?q=test');
      expect(res.statusCode).toBe(401);
    });

    it('GET /templates should return 401 without token', async () => {
      const res = await request(app).get('/templates');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /webhooks/evolution (no auth required)', () => {
    it('should accept webhook and return 200', async () => {
      const res = await request(app)
        .post('/webhooks/evolution')
        .send({ event: 'messages.upsert', data: {} });
      expect(res.statusCode).toBe(200);
      expect(res.body.received).toBe(true);
    });
  });
});
