import request from 'supertest';
import app, { server } from '../../src/server';
import { closeDatabase } from '../../src/config/database';

describe('Issues API Integration Tests', () => {
  // Cleanup after all tests
  afterAll((done) => {
    // Close server if it exists (shouldn't in test mode, but be safe)
    if (server) {
      server.close(() => {
        closeDatabase();
        done();
      });
    } else {
      closeDatabase();
      done();
    }
  });
  describe('POST /api/issues', () => {
    it('should create a new issue', async () => {
      const issueData = {
        title: 'Missing consent form',
        description: 'Consent form not in file for patient 003',
        site: 'Site-101',
        severity: 'major',
        status: 'open',
      };

      const response = await request(app)
        .post('/api/issues')
        .send(issueData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeGreaterThan(0);
      expect(response.body.data.title).toBe(issueData.title);
      expect(response.body.data.description).toBe(issueData.description);
      expect(response.body.data.site).toBe(issueData.site);
      expect(response.body.data.severity).toBe(issueData.severity);
      expect(response.body.data.status).toBe(issueData.status);
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should create issue with default status when not provided', async () => {
      const issueData = {
        title: 'Test Issue',
        description: 'Test Description',
        site: 'Site-202',
        severity: 'minor',
      };

      const response = await request(app)
        .post('/api/issues')
        .send(issueData)
        .expect(201);

      expect(response.body.data.status).toBe('open');
    });

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

  describe('GET /api/issues/:id', () => {
    it('should return an issue by ID', async () => {
      // Create an issue first
      const createResponse = await request(app)
        .post('/api/issues')
        .send({
          title: 'Get Test Issue',
          description: 'Test Description',
          site: 'Site-101',
          severity: 'critical',
        })
        .expect(201);

      const issueId = createResponse.body.data.id;

      // Get the issue
      const response = await request(app)
        .get(`/api/issues/${issueId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(issueId);
      expect(response.body.data.title).toBe('Get Test Issue');
    });

    it('should return 404 when issue does not exist', async () => {
      const response = await request(app)
        .get('/api/issues/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Issue not found');
    });

    it('should return 400 when ID is invalid', async () => {
      const response = await request(app)
        .get('/api/issues/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid issue ID');
    });
  });

  describe('PUT /api/issues/:id', () => {
    it('should update an existing issue', async () => {
      // Create an issue first
      const createResponse = await request(app)
        .post('/api/issues')
        .send({
          title: 'Original Title',
          description: 'Original Description',
          site: 'Site-101',
          severity: 'minor',
        })
        .expect(201);

      const issueId = createResponse.body.data.id;

      // Update the issue
      const updateResponse = await request(app)
        .put(`/api/issues/${issueId}`)
        .send({
          title: 'Updated Title',
          status: 'resolved',
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.title).toBe('Updated Title');
      expect(updateResponse.body.data.status).toBe('resolved');
      expect(updateResponse.body.data.description).toBe('Original Description'); // unchanged
    });

    it('should return 404 when updating non-existent issue', async () => {
      const response = await request(app)
        .put('/api/issues/99999')
        .send({
          title: 'Updated Title',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Issue not found');
    });

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

  describe('DELETE /api/issues/:id', () => {
    it('should delete an existing issue', async () => {
      // Create an issue first
      const createResponse = await request(app)
        .post('/api/issues')
        .send({
          title: 'To Be Deleted',
          description: 'Will be deleted',
          site: 'Site-101',
          severity: 'minor',
        })
        .expect(201);

      const issueId = createResponse.body.data.id;

      // Delete the issue
      await request(app)
        .delete(`/api/issues/${issueId}`)
        .expect(204);

      // Verify it's deleted
      await request(app)
        .get(`/api/issues/${issueId}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent issue', async () => {
      const response = await request(app)
        .delete('/api/issues/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Issue not found');
    });

    it('should return 400 when ID is invalid', async () => {
      const response = await request(app)
        .delete('/api/issues/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid issue ID');
    });
  });

  describe('Full CRUD Flow', () => {
    it('should complete full CRUD cycle', async () => {
      // Create
      const createResponse = await request(app)
        .post('/api/issues')
        .send({
          title: 'Full CRUD Test',
          description: 'Testing full cycle',
          site: 'Site-303',
          severity: 'major',
        })
        .expect(201);

      const issueId = createResponse.body.data.id;

      // Read
      const getResponse = await request(app)
        .get(`/api/issues/${issueId}`)
        .expect(200);

      expect(getResponse.body.data.title).toBe('Full CRUD Test');

      // Update
      const updateResponse = await request(app)
        .put(`/api/issues/${issueId}`)
        .send({
          status: 'in_progress',
          severity: 'critical',
        })
        .expect(200);

      expect(updateResponse.body.data.status).toBe('in_progress');
      expect(updateResponse.body.data.severity).toBe('critical');

      // Delete
      await request(app)
        .delete(`/api/issues/${issueId}`)
        .expect(204);

      // Verify deleted
      await request(app)
        .get(`/api/issues/${issueId}`)
        .expect(404);
    });
  });
});

