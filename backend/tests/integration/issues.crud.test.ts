import request from 'supertest';
import app, { server } from '../../src/server';

describe('Issues API - CRUD Operations', () => {
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
      expect(response.body.data.id).toBeDefined();
      expect(typeof response.body.data.id).toBe('string');
      expect(response.body.data.id.length).toBeGreaterThan(0);
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
  });

  describe('GET /api/issues', () => {
    it('should return paginated list of issues', async () => {
      // Create multiple issues first
      const issues = [];
      for (let i = 1; i <= 5; i++) {
        const createResponse = await request(app)
          .post('/api/issues')
          .send({
            title: `Test Issue ${i}`,
            description: `Test Description ${i}`,
            site: `Site-${100 + i}`,
            severity: i % 2 === 0 ? 'major' : 'minor',
          })
          .expect(201);
        issues.push(createResponse.body.data);
      }

      // Get all issues with pagination
      const response = await request(app)
        .get('/api/issues?page=1&pageSize=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.data).toBeDefined();
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.pageSize).toBe(10);
      expect(response.body.data.pagination.total).toBeGreaterThanOrEqual(5);
      expect(response.body.data.pagination.totalPages).toBeGreaterThanOrEqual(1);
    });

    it('should return issues ordered by createdAt DESC (newest first)', async () => {
      // Create two issues with a small delay
      const firstResponse = await request(app)
        .post('/api/issues')
        .send({
          title: 'First Issue',
          description: 'First Description',
          site: 'Site-201',
          severity: 'minor',
        })
        .expect(201);

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const secondResponse = await request(app)
        .post('/api/issues')
        .send({
          title: 'Second Issue',
          description: 'Second Description',
          site: 'Site-202',
          severity: 'major',
        })
        .expect(201);

      // Get all issues
      const response = await request(app)
        .get('/api/issues?page=1&pageSize=100')
        .expect(200);

      const issues = response.body.data.data;
      expect(issues.length).toBeGreaterThanOrEqual(2);

      // Find the two issues we created
      const firstIssue = issues.find((i: any) => i.id === firstResponse.body.data.id);
      const secondIssue = issues.find((i: any) => i.id === secondResponse.body.data.id);
      
      expect(firstIssue).toBeDefined();
      expect(secondIssue).toBeDefined();
      
      // The most recent issue (second) should come before the older one (first)
      const firstIndex = issues.indexOf(firstIssue);
      const secondIndex = issues.indexOf(secondIssue);
      
      expect(secondIndex).toBeLessThan(firstIndex);
    });

    it('should use default pagination when params not provided', async () => {
      const response = await request(app)
        .get('/api/issues')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.pageSize).toBe(10);
    });

    it('should handle pagination correctly', async () => {
      // Create 15 issues
      for (let i = 1; i <= 15; i++) {
        await request(app)
          .post('/api/issues')
          .send({
            title: `Pagination Test Issue ${i}`,
            description: `Description ${i}`,
            site: `Site-${300 + i}`,
            severity: 'minor',
          })
          .expect(201);
      }

      // Get first page
      const page1Response = await request(app)
        .get('/api/issues?page=1&pageSize=5')
        .expect(200);

      expect(page1Response.body.data.pagination.page).toBe(1);
      expect(page1Response.body.data.pagination.pageSize).toBe(5);
      expect(page1Response.body.data.data.length).toBe(5);

      // Get second page
      const page2Response = await request(app)
        .get('/api/issues?page=2&pageSize=5')
        .expect(200);

      expect(page2Response.body.data.pagination.page).toBe(2);
      expect(page2Response.body.data.pagination.pageSize).toBe(5);
      expect(page2Response.body.data.data.length).toBe(5);

      // Verify different issues on different pages
      const page1Ids = page1Response.body.data.data.map((i: any) => i.id);
      const page2Ids = page2Response.body.data.data.map((i: any) => i.id);
      
      // No overlap between pages
      const overlap = page1Ids.filter((id: number) => page2Ids.includes(id));
      expect(overlap.length).toBe(0);
    });

    it('should return empty array when page exceeds total pages', async () => {
      const response = await request(app)
        .get('/api/issues?page=9999&pageSize=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toEqual([]);
      expect(response.body.data.pagination.page).toBe(9999);
      expect(response.body.data.pagination.totalPages).toBeLessThan(9999);
    });

    it('should calculate totalPages correctly', async () => {
      // Create 25 issues
      for (let i = 1; i <= 25; i++) {
        await request(app)
          .post('/api/issues')
          .send({
            title: `Total Pages Test ${i}`,
            description: `Description ${i}`,
            site: `Site-${400 + i}`,
            severity: 'minor',
          })
          .expect(201);
      }

      const response = await request(app)
        .get('/api/issues?page=1&pageSize=10')
        .expect(200);

      const { total, totalPages, pageSize } = response.body.data.pagination;
      expect(totalPages).toBe(Math.ceil(total / pageSize));
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
        .get('/api/issues/550e8400-e29b-41d4-a716-446655440000')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Issue not found');
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
        .put('/api/issues/550e8400-e29b-41d4-a716-446655440000')
        .send({
          title: 'Updated Title',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Issue not found');
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
        .delete('/api/issues/550e8400-e29b-41d4-a716-446655440000')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Issue not found');
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



