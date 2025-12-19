import request from 'supertest';
import app, { server } from '../../src/server';

describe('Issues API - Validation', () => {
  // Cleanup after all tests
  afterAll((done) => {
    if (server) {
      server.close(() => {
        done();
      });
    } else {
      done();
    }
  });

  describe('POST /api/issues - Validation', () => {
    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/issues')
        .send({
          title: 'Incomplete Issue',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 when severity is invalid', async () => {
      const response = await request(app)
        .post('/api/issues')
        .send({
          title: 'Test Issue',
          description: 'Test Description',
          site: 'Site-101',
          severity: 'invalid',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 when status is invalid', async () => {
      const response = await request(app)
        .post('/api/issues')
        .send({
          title: 'Test Issue',
          description: 'Test Description',
          site: 'Site-101',
          severity: 'major',
          status: 'invalid',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/issues - Pagination Validation', () => {
    it('should return 400 when page is less than 1', async () => {
      const response = await request(app)
        .get('/api/issues?page=0&pageSize=10')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
      expect(response.body.details.some((d: any) => d.msg.includes('Page must be a positive integer'))).toBe(true);
    });

    it('should return 400 when pageSize is less than 1', async () => {
      const response = await request(app)
        .get('/api/issues?page=1&pageSize=0')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
      expect(response.body.details.some((d: any) => 
        d.msg.includes('Page size must be at least 1')
      )).toBe(true);
    });

    it('should return 400 when pageSize is greater than 100', async () => {
      const response = await request(app)
        .get('/api/issues?page=1&pageSize=101')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
      expect(response.body.details.some((d: any) => 
        d.msg.includes('Page size must be at most 100')
      )).toBe(true);
    });
  });

  describe('GET /api/issues/:id - Validation', () => {
    it('should return 400 when ID is invalid', async () => {
      const response = await request(app)
        .get('/api/issues/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
      expect(response.body.details.some((d: any) => d.msg.includes('Issue ID must be a valid UUID'))).toBe(true);
    });
  });

  describe('PUT /api/issues/:id - Validation', () => {
    it('should return 400 when validation fails', async () => {
      // Create an issue first
      const createResponse = await request(app)
        .post('/api/issues')
        .send({
          title: 'Test Issue',
          description: 'Test Description',
          site: 'Site-101',
          severity: 'major',
        })
        .expect(201);

      const issueId = createResponse.body.data.id;

      // Try to update with invalid severity
      const response = await request(app)
        .put(`/api/issues/${issueId}`)
        .send({
          severity: 'invalid',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 when no fields provided', async () => {
      // Create an issue first
      const createResponse = await request(app)
        .post('/api/issues')
        .send({
          title: 'Test Issue',
          description: 'Test Description',
          site: 'Site-101',
          severity: 'major',
        })
        .expect(201);

      const issueId = createResponse.body.data.id;

      // Try to update with empty body
      const response = await request(app)
        .put(`/api/issues/${issueId}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/issues/:id - Validation', () => {
    it('should return 400 when ID is invalid', async () => {
      const response = await request(app)
        .delete('/api/issues/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
      expect(response.body.details.some((d: any) => d.msg.includes('Issue ID must be a valid UUID'))).toBe(true);
    });
  });
});

