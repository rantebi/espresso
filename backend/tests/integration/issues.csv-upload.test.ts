import request from 'supertest';
import app, { server } from '../../src/server';
import { Buffer } from 'buffer';

describe('Issues API - CSV Upload', () => {
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

  describe('POST /api/issues/upload', () => {
    it('should upload and create issues from valid CSV', async () => {
      const csvContent = `title,description,site,severity,status,createdAt
Missing consent form,Consent form not in file for patient 003,Site-101,major,open,2025-05-01T09:00:00Z
Late visit,Visit week 4 occurred on week 6,Site-202,minor,in_progress,2025-05-03T12:30:00Z
Drug temp excursion,IP stored above max temp for 6 hours,Site-101,critical,open,2025-05-10T08:15:00Z`;

      const response = await request(app)
        .post('/api/issues/upload')
        .attach('csv', Buffer.from(csvContent), 'issues.csv')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(3);
      expect(response.body.data.created).toBe(3);
      expect(response.body.data.failed).toBe(0);
      expect(response.body.data.issues).toHaveLength(3);
      expect(response.body.data.errors).toHaveLength(0);

      // Verify first issue
      const issue1 = response.body.data.issues[0];
      expect(issue1.title).toBe('Missing consent form');
      expect(issue1.site).toBe('Site-101');
      expect(issue1.severity).toBe('major');
      expect(issue1.status).toBe('open');
      expect(issue1.createdAt).toBe('2025-05-01T09:00:00.000Z');

      // Verify second issue
      const issue2 = response.body.data.issues[1];
      expect(issue2.title).toBe('Late visit');
      expect(issue2.status).toBe('in_progress');
      expect(issue2.createdAt).toBe('2025-05-03T12:30:00.000Z');
    });

    it('should use createdAt from CSV when provided', async () => {
      const csvContent = `title,description,site,severity,status,createdAt
Test Issue,Test Description,Site-101,major,open,2025-01-15T10:30:00Z`;

      const response = await request(app)
        .post('/api/issues/upload')
        .attach('csv', Buffer.from(csvContent), 'issues.csv')
        .expect(200);

      expect(response.body.data.created).toBe(1);
      expect(response.body.data.issues[0].createdAt).toBe('2025-01-15T10:30:00.000Z');
    });

    it('should use current time when createdAt is missing from CSV', async () => {
      const csvContent = `title,description,site,severity,status
Test Issue,Test Description,Site-101,major,open`;

      const beforeTime = new Date().toISOString();

      const response = await request(app)
        .post('/api/issues/upload')
        .attach('csv', Buffer.from(csvContent), 'issues.csv')
        .expect(200);

      const afterTime = new Date().toISOString();

      expect(response.body.data.created).toBe(1);
      const createdAt = response.body.data.issues[0].createdAt;
      expect(createdAt).toBeDefined();
      expect(createdAt >= beforeTime).toBe(true);
      expect(createdAt <= afterTime).toBe(true);
    });

    it('should handle CSV with default status when status is missing', async () => {
      const csvContent = `title,description,site,severity
Test Issue,Test Description,Site-101,major`;

      const response = await request(app)
        .post('/api/issues/upload')
        .attach('csv', Buffer.from(csvContent), 'issues.csv')
        .expect(200);

      expect(response.body.data.created).toBe(1);
      expect(response.body.data.issues[0].status).toBe('open');
    });

    it('should return error when no file is uploaded', async () => {
      const response = await request(app)
        .post('/api/issues/upload')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No file uploaded');
      expect(response.body.message).toBe('Please upload a CSV file');
    });

    it('should return error for empty CSV file', async () => {
      const csvContent = `title,description,site,severity,status,createdAt`;

      const response = await request(app)
        .post('/api/issues/upload')
        .attach('csv', Buffer.from(csvContent), 'empty.csv')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Empty CSV');
      expect(response.body.message).toBe('The CSV file contains no data');
    });

    it('should return error for invalid CSV format', async () => {
      const csvContent = `invalid,csv,format
this,is,not,properly,formatted`;

      const response = await request(app)
        .post('/api/issues/upload')
        .attach('csv', Buffer.from(csvContent), 'invalid.csv')
        .expect(200);

      // CSV parsing succeeds but validation fails
      expect(response.body.data.total).toBeGreaterThan(0);
      expect(response.body.data.failed).toBeGreaterThan(0);
      expect(response.body.data.errors.length).toBeGreaterThan(0);
    });

    it('should handle missing required fields', async () => {
      const csvContent = `title,description,site,severity,status,createdAt
Missing title field,Description,Site-101,,open,2025-05-01T09:00:00Z
,Missing description,Site-101,major,open,2025-05-01T09:00:00Z
Title Only,,,major,open,2025-05-01T09:00:00Z`;

      const response = await request(app)
        .post('/api/issues/upload')
        .attach('csv', Buffer.from(csvContent), 'issues.csv')
        .expect(200);

      expect(response.body.data.total).toBe(3);
      expect(response.body.data.created).toBe(0);
      expect(response.body.data.failed).toBe(3);
      expect(response.body.data.errors.length).toBe(3);

      // Check that errors mention missing required fields
      const errors = response.body.data.errors;
      errors.forEach((error: any) => {
        expect(error.error).toContain('Missing required fields');
        expect(error.row).toBeGreaterThanOrEqual(2); // Row 2, 3, or 4
      });
    });

    it('should handle invalid severity values', async () => {
      const csvContent = `title,description,site,severity,status,createdAt
Valid Issue,Valid Description,Site-101,major,open,2025-05-01T09:00:00Z
Invalid Severity,Description,Site-101,invalid_severity,open,2025-05-01T09:00:00Z`;

      const response = await request(app)
        .post('/api/issues/upload')
        .attach('csv', Buffer.from(csvContent), 'issues.csv')
        .expect(200);

      expect(response.body.data.total).toBe(2);
      expect(response.body.data.created).toBe(1);
      expect(response.body.data.failed).toBe(1);
      expect(response.body.data.errors.length).toBe(1);
      expect(response.body.data.errors[0].error).toContain('Invalid severity');
    });

    it('should handle invalid status values', async () => {
      const csvContent = `title,description,site,severity,status,createdAt
Valid Issue,Valid Description,Site-101,major,open,2025-05-01T09:00:00Z
Invalid Status,Description,Site-101,major,invalid_status,2025-05-01T09:00:00Z`;

      const response = await request(app)
        .post('/api/issues/upload')
        .attach('csv', Buffer.from(csvContent), 'issues.csv')
        .expect(200);

      expect(response.body.data.total).toBe(2);
      expect(response.body.data.created).toBe(1);
      expect(response.body.data.failed).toBe(1);
      expect(response.body.data.errors.length).toBe(1);
      expect(response.body.data.errors[0].error).toContain('Invalid status');
    });

    it('should handle invalid createdAt date format', async () => {
      const csvContent = `title,description,site,severity,status,createdAt
Valid Issue,Valid Description,Site-101,major,open,2025-05-01T09:00:00Z
Invalid Date,Description,Site-101,major,open,not-a-date`;

      const response = await request(app)
        .post('/api/issues/upload')
        .attach('csv', Buffer.from(csvContent), 'issues.csv')
        .expect(200);

      expect(response.body.data.total).toBe(2);
      expect(response.body.data.created).toBe(1);
      expect(response.body.data.failed).toBe(1);
      expect(response.body.data.errors.length).toBe(1);
      expect(response.body.data.errors[0].error).toContain('Invalid createdAt date');
    });

    it('should handle partial success with mixed valid and invalid rows', async () => {
      const csvContent = `title,description,site,severity,status,createdAt
Valid Issue 1,Valid Description 1,Site-101,major,open,2025-05-01T09:00:00Z
Invalid Severity,Description,Site-101,invalid,open,2025-05-01T09:00:00Z
Valid Issue 2,Valid Description 2,Site-202,minor,in_progress,2025-05-02T10:00:00Z
,Missing title,Site-101,critical,open,2025-05-01T09:00:00Z
Valid Issue 3,Valid Description 3,Site-303,critical,resolved,2025-05-03T11:00:00Z`;

      const response = await request(app)
        .post('/api/issues/upload')
        .attach('csv', Buffer.from(csvContent), 'issues.csv')
        .expect(200);

      expect(response.body.data.total).toBe(5);
      expect(response.body.data.created).toBe(3);
      expect(response.body.data.failed).toBe(2);
      expect(response.body.data.issues.length).toBe(3);
      expect(response.body.data.errors.length).toBe(2);

      // Verify created issues
      const createdTitles = response.body.data.issues.map((issue: any) => issue.title);
      expect(createdTitles).toContain('Valid Issue 1');
      expect(createdTitles).toContain('Valid Issue 2');
      expect(createdTitles).toContain('Valid Issue 3');

      // Verify error details
      const errors = response.body.data.errors;
      expect(errors.some((e: any) => e.error.includes('Invalid severity'))).toBe(true);
      expect(errors.some((e: any) => e.error.includes('Missing required fields'))).toBe(true);
    });

    it('should handle CSV with extra whitespace', async () => {
      const csvContent = `title,description,site,severity,status,createdAt
  Title with spaces  ,  Description with spaces  ,  Site-101  ,  major  ,  open  ,  2025-05-01T09:00:00Z  `;

      const response = await request(app)
        .post('/api/issues/upload')
        .attach('csv', Buffer.from(csvContent), 'issues.csv')
        .expect(200);

      expect(response.body.data.created).toBe(1);
      expect(response.body.data.issues[0].title).toBe('Title with spaces');
      expect(response.body.data.issues[0].description).toBe('Description with spaces');
      expect(response.body.data.issues[0].site).toBe('Site-101');
    });

    it('should handle CSV with all severity levels', async () => {
      const csvContent = `title,description,site,severity,status,createdAt
Minor Issue,Description,Site-101,minor,open,2025-05-01T09:00:00Z
Major Issue,Description,Site-101,major,open,2025-05-01T09:00:00Z
Critical Issue,Description,Site-101,critical,open,2025-05-01T09:00:00Z`;

      const response = await request(app)
        .post('/api/issues/upload')
        .attach('csv', Buffer.from(csvContent), 'issues.csv')
        .expect(200);

      expect(response.body.data.created).toBe(3);
      const severities = response.body.data.issues.map((issue: any) => issue.severity);
      expect(severities).toContain('minor');
      expect(severities).toContain('major');
      expect(severities).toContain('critical');
    });

    it('should handle CSV with all status values', async () => {
      const csvContent = `title,description,site,severity,status,createdAt
Open Issue,Description,Site-101,major,open,2025-05-01T09:00:00Z
In Progress Issue,Description,Site-101,major,in_progress,2025-05-01T09:00:00Z
Resolved Issue,Description,Site-101,major,resolved,2025-05-01T09:00:00Z`;

      const response = await request(app)
        .post('/api/issues/upload')
        .attach('csv', Buffer.from(csvContent), 'issues.csv')
        .expect(200);

      expect(response.body.data.created).toBe(3);
      const statuses = response.body.data.issues.map((issue: any) => issue.status);
      expect(statuses).toContain('open');
      expect(statuses).toContain('in_progress');
      expect(statuses).toContain('resolved');
    });

    it('should reject non-CSV files', async () => {
      const textContent = 'This is not a CSV file';

      const response = await request(app)
        .post('/api/issues/upload')
        .attach('csv', Buffer.from(textContent), 'text.txt')
        .expect(400);

      // Multer fileFilter should reject non-CSV files
      // The error format may vary depending on multer configuration
      expect(response.status).toBe(400);
    });

    it('should handle very large CSV files', async () => {
      // Create a CSV with 100 rows
      const headers = 'title,description,site,severity,status,createdAt\n';
      const rows = Array.from({ length: 100 }, (_, i) => 
        `Issue ${i},Description ${i},Site-${i % 10 + 1},major,open,2025-05-01T09:00:00Z`
      ).join('\n');
      const csvContent = headers + rows;

      const response = await request(app)
        .post('/api/issues/upload')
        .attach('csv', Buffer.from(csvContent), 'large.csv')
        .expect(200);

      expect(response.body.data.total).toBe(100);
      expect(response.body.data.created).toBe(100);
      expect(response.body.data.failed).toBe(0);
    });
  });
});

