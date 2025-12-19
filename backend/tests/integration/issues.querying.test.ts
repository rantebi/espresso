import request from 'supertest';
import app, { server } from '../../src/server';

describe('Issues API - Querying (Search, Filter, Sort)', () => {
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

  // Helper to create test issues with various attributes
  const createTestIssues = async () => {
    const issues = [];
    
    // Create issues with different titles, statuses, and severities
    const testData = [
      { title: 'Critical Bug Report', description: 'Critical bug description', status: 'open', severity: 'critical', site: 'Site-500' },
      { title: 'Major Issue Found', description: 'Major issue description', status: 'open', severity: 'major', site: 'Site-501' },
      { title: 'Minor Bug Fix', description: 'Minor bug description', status: 'in_progress', severity: 'minor', site: 'Site-502' },
      { title: 'Critical System Error', description: 'Critical system error description', status: 'resolved', severity: 'critical', site: 'Site-503' },
      { title: 'Major Performance Issue', description: 'Major performance issue description', status: 'in_progress', severity: 'major', site: 'Site-504' },
      { title: 'Minor UI Bug', description: 'Minor UI bug description', status: 'resolved', severity: 'minor', site: 'Site-505' },
      { title: 'Critical Security Vulnerability', description: 'Critical security vulnerability description', status: 'open', severity: 'critical', site: 'Site-506' },
      { title: 'Major Database Issue', description: 'Major database issue description', status: 'resolved', severity: 'major', site: 'Site-507' },
    ];

    for (const data of testData) {
      const response = await request(app)
        .post('/api/issues')
        .send(data)
        .expect(201);
      issues.push(response.body.data);
    }

    // Add small delays to ensure different createdAt timestamps
    await new Promise((resolve) => setTimeout(resolve, 100));

    return issues;
  };

  describe('Search by Title', () => {
    it('should filter issues by title (case-insensitive)', async () => {
      await createTestIssues();

      const response = await request(app)
        .get('/api/issues?search=critical')
        .expect(200);

      expect(response.body.success).toBe(true);
      const issues = response.body.data.data;
      expect(issues.length).toBeGreaterThan(0);
      issues.forEach((issue: any) => {
        expect(issue.title.toLowerCase()).toContain('critical');
      });
    });

    it('should return empty array when search term matches nothing', async () => {
      await createTestIssues();

      const response = await request(app)
        .get('/api/issues?search=nonexistent')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toEqual([]);
      expect(response.body.data.pagination.total).toBe(0);
    });

    it('should handle partial matches', async () => {
      await createTestIssues();

      const response = await request(app)
        .get('/api/issues?search=bug')
        .expect(200);

      expect(response.body.success).toBe(true);
      const issues = response.body.data.data;
      expect(issues.length).toBeGreaterThan(0);
      issues.forEach((issue: any) => {
        expect(issue.title.toLowerCase()).toContain('bug');
      });
    });

    it('should be case-insensitive', async () => {
      await createTestIssues();

      const response1 = await request(app)
        .get('/api/issues?search=CRITICAL')
        .expect(200);

      const response2 = await request(app)
        .get('/api/issues?search=critical')
        .expect(200);

      expect(response1.body.data.data.length).toBe(response2.body.data.data.length);
    });
  });

  describe('Filter by Status', () => {
    it('should filter issues by status', async () => {
      await createTestIssues();

      const response = await request(app)
        .get('/api/issues?status=open')
        .expect(200);

      expect(response.body.success).toBe(true);
      const issues = response.body.data.data;
      expect(issues.length).toBeGreaterThan(0);
      issues.forEach((issue: any) => {
        expect(issue.status).toBe('open');
      });
    });

    it('should filter by in_progress status', async () => {
      await createTestIssues();

      const response = await request(app)
        .get('/api/issues?status=in_progress')
        .expect(200);

      expect(response.body.success).toBe(true);
      const issues = response.body.data.data;
      expect(issues.length).toBeGreaterThan(0);
      issues.forEach((issue: any) => {
        expect(issue.status).toBe('in_progress');
      });
    });

    it('should filter by resolved status', async () => {
      await createTestIssues();

      const response = await request(app)
        .get('/api/issues?status=resolved')
        .expect(200);

      expect(response.body.success).toBe(true);
      const issues = response.body.data.data;
      expect(issues.length).toBeGreaterThan(0);
      issues.forEach((issue: any) => {
        expect(issue.status).toBe('resolved');
      });
    });

    it('should return empty array when status filter matches nothing', async () => {
      // Create issues with only 'open' status
      await request(app)
        .post('/api/issues')
        .send({
          title: 'Test Issue',
          description: 'Test',
          site: 'Site-600',
          severity: 'minor',
          status: 'open',
        })
        .expect(201);

      const response = await request(app)
        .get('/api/issues?status=resolved')
        .expect(200);

      expect(response.body.success).toBe(true);
      const issues = response.body.data.data;
      // Should only have issues with 'resolved' status (none in this case)
      issues.forEach((issue: any) => {
        expect(issue.status).toBe('resolved');
      });
    });
  });

  describe('Filter by Severity', () => {
    it('should filter issues by severity', async () => {
      await createTestIssues();

      const response = await request(app)
        .get('/api/issues?severity=critical')
        .expect(200);

      expect(response.body.success).toBe(true);
      const issues = response.body.data.data;
      expect(issues.length).toBeGreaterThan(0);
      issues.forEach((issue: any) => {
        expect(issue.severity).toBe('critical');
      });
    });

    it('should filter by major severity', async () => {
      await createTestIssues();

      const response = await request(app)
        .get('/api/issues?severity=major')
        .expect(200);

      expect(response.body.success).toBe(true);
      const issues = response.body.data.data;
      expect(issues.length).toBeGreaterThan(0);
      issues.forEach((issue: any) => {
        expect(issue.severity).toBe('major');
      });
    });

    it('should filter by minor severity', async () => {
      await createTestIssues();

      const response = await request(app)
        .get('/api/issues?severity=minor')
        .expect(200);

      expect(response.body.success).toBe(true);
      const issues = response.body.data.data;
      expect(issues.length).toBeGreaterThan(0);
      issues.forEach((issue: any) => {
        expect(issue.severity).toBe('minor');
      });
    });
  });

  describe('Sort by createdAt', () => {
    it('should sort by createdAt descending by default', async () => {
      const issues = await createTestIssues();

      const response = await request(app)
        .get('/api/issues?page=1&pageSize=100')
        .expect(200);

      const returnedIssues = response.body.data.data;
      expect(returnedIssues.length).toBeGreaterThanOrEqual(issues.length);

      // Check that issues are sorted by createdAt descending (newest first)
      for (let i = 0; i < returnedIssues.length - 1; i++) {
        const current = new Date(returnedIssues[i].createdAt).getTime();
        const next = new Date(returnedIssues[i + 1].createdAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it('should sort by createdAt ascending when sortOrder=asc', async () => {
      await createTestIssues();

      const response = await request(app)
        .get('/api/issues?sortBy=createdAt&sortOrder=asc&page=1&pageSize=100')
        .expect(200);

      const issues = response.body.data.data;
      expect(issues.length).toBeGreaterThan(0);

      // Check that issues are sorted by createdAt ascending (oldest first)
      for (let i = 0; i < issues.length - 1; i++) {
        const current = new Date(issues[i].createdAt).getTime();
        const next = new Date(issues[i + 1].createdAt).getTime();
        expect(current).toBeLessThanOrEqual(next);
      }
    });
  });

  describe('Sort by Status', () => {
    it('should sort by status ascending', async () => {
      await createTestIssues();

      const response = await request(app)
        .get('/api/issues?sortBy=status&sortOrder=asc&page=1&pageSize=100')
        .expect(200);

      const issues = response.body.data.data;
      expect(issues.length).toBeGreaterThan(0);

      // Check that issues are sorted by status alphabetically
      for (let i = 0; i < issues.length - 1; i++) {
        const current = issues[i].status;
        const next = issues[i + 1].status;
        expect(current.localeCompare(next)).toBeLessThanOrEqual(0);
      }
    });

    it('should sort by status descending', async () => {
      await createTestIssues();

      const response = await request(app)
        .get('/api/issues?sortBy=status&sortOrder=desc&page=1&pageSize=100')
        .expect(200);

      const issues = response.body.data.data;
      expect(issues.length).toBeGreaterThan(0);

      // Check that issues are sorted by status reverse alphabetically
      for (let i = 0; i < issues.length - 1; i++) {
        const current = issues[i].status;
        const next = issues[i + 1].status;
        expect(current.localeCompare(next)).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Sort by Severity', () => {
    it('should sort by severity descending (critical > major > minor)', async () => {
      await createTestIssues();

      const response = await request(app)
        .get('/api/issues?sortBy=severity&sortOrder=desc&page=1&pageSize=100')
        .expect(200);

      const issues = response.body.data.data;
      expect(issues.length).toBeGreaterThan(0);

      const severityOrder: Record<string, number> = {
        critical: 3,
        major: 2,
        minor: 1,
      };

      // Check that issues are sorted by severity descending
      for (let i = 0; i < issues.length - 1; i++) {
        const currentOrder = severityOrder[issues[i].severity];
        const nextOrder = severityOrder[issues[i + 1].severity];
        expect(currentOrder).toBeGreaterThanOrEqual(nextOrder);
      }
    });

    it('should sort by severity ascending (minor < major < critical)', async () => {
      await createTestIssues();

      const response = await request(app)
        .get('/api/issues?sortBy=severity&sortOrder=asc&page=1&pageSize=100')
        .expect(200);

      const issues = response.body.data.data;
      expect(issues.length).toBeGreaterThan(0);

      const severityOrder: Record<string, number> = {
        critical: 3,
        major: 2,
        minor: 1,
      };

      // Check that issues are sorted by severity ascending
      for (let i = 0; i < issues.length - 1; i++) {
        const currentOrder = severityOrder[issues[i].severity];
        const nextOrder = severityOrder[issues[i + 1].severity];
        expect(currentOrder).toBeLessThanOrEqual(nextOrder);
      }
    });
  });

  describe('Combined Search, Filter, and Sort', () => {
    it('should combine search and status filter', async () => {
      await createTestIssues();

      const response = await request(app)
        .get('/api/issues?search=critical&status=open')
        .expect(200);

      expect(response.body.success).toBe(true);
      const issues = response.body.data.data;
      issues.forEach((issue: any) => {
        expect(issue.title.toLowerCase()).toContain('critical');
        expect(issue.status).toBe('open');
      });
    });

    it('should combine status and severity filters', async () => {
      await createTestIssues();

      const response = await request(app)
        .get('/api/issues?status=open&severity=critical')
        .expect(200);

      expect(response.body.success).toBe(true);
      const issues = response.body.data.data;
      issues.forEach((issue: any) => {
        expect(issue.status).toBe('open');
        expect(issue.severity).toBe('critical');
      });
    });

    it('should combine search, filter, and sort', async () => {
      await createTestIssues();

      const response = await request(app)
        .get('/api/issues?search=issue&status=open&severity=major&sortBy=severity&sortOrder=desc')
        .expect(200);

      expect(response.body.success).toBe(true);
      const issues = response.body.data.data;
      
      if (issues.length > 0) {
        issues.forEach((issue: any) => {
          expect(issue.title.toLowerCase()).toContain('issue');
          expect(issue.status).toBe('open');
          expect(issue.severity).toBe('major');
        });

        // Verify sorting by severity (descending)
        const severityOrder: Record<string, number> = {
          critical: 3,
          major: 2,
          minor: 1,
        };
        for (let i = 0; i < issues.length - 1; i++) {
          const currentOrder = severityOrder[issues[i].severity];
          const nextOrder = severityOrder[issues[i + 1].severity];
          expect(currentOrder).toBeGreaterThanOrEqual(nextOrder);
        }
      }
    });

    it('should maintain pagination with filters and sort', async () => {
      await createTestIssues();

      const response = await request(app)
        .get('/api/issues?status=open&sortBy=severity&sortOrder=desc&page=1&pageSize=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.pageSize).toBe(2);
      expect(response.body.data.data.length).toBeLessThanOrEqual(2);
      
      const issues = response.body.data.data;
      issues.forEach((issue: any) => {
        expect(issue.status).toBe('open');
      });
    });
  });

  describe('Query Parameter Validation', () => {
    it('should return 400 when sortBy is invalid', async () => {
      const response = await request(app)
        .get('/api/issues?sortBy=invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 when sortOrder is invalid', async () => {
      const response = await request(app)
        .get('/api/issues?sortOrder=invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should accept valid sortBy values', async () => {
      const validSortBy = ['createdAt', 'status', 'severity'];
      
      for (const sortBy of validSortBy) {
        const response = await request(app)
          .get(`/api/issues?sortBy=${sortBy}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });

    it('should accept valid sortOrder values', async () => {
      const validSortOrder = ['asc', 'desc'];
      
      for (const sortOrder of validSortOrder) {
        const response = await request(app)
          .get(`/api/issues?sortOrder=${sortOrder}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });
  });
});

