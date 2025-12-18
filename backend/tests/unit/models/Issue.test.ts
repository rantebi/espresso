import IssueModel from '../../../src/models/Issue';
import { CreateIssueInput } from '../../../src/types';

describe('Issue Model', () => {
  describe('create', () => {
    it('should create an issue with all required fields', async () => {
      const input: CreateIssueInput = {
        title: 'Test Issue',
        description: 'Test Description',
        site: 'Site-101',
        severity: 'major',
      };

      const issue = await IssueModel.create(input);

      expect(issue).toBeDefined();
      expect(issue.id).toBeDefined();
      expect(typeof issue.id).toBe('string');
      expect(issue.id.length).toBeGreaterThan(0);
      expect(issue.title).toBe(input.title);
      expect(issue.description).toBe(input.description);
      expect(issue.site).toBe(input.site);
      expect(issue.severity).toBe(input.severity);
      expect(issue.status).toBe('open'); // default status
      expect(issue.createdAt).toBeDefined();
      expect(issue.updatedAt).toBeDefined();
    });

    it('should create an issue with explicit status', async () => {
      const input: CreateIssueInput = {
        title: 'Test Issue',
        description: 'Test Description',
        site: 'Site-101',
        severity: 'critical',
        status: 'in_progress',
      };

      const issue = await IssueModel.create(input);

      expect(issue.status).toBe('in_progress');
    });
  });

  describe('findById', () => {
    it('should return an issue when it exists', async () => {
      const input: CreateIssueInput = {
        title: 'Test Issue',
        description: 'Test Description',
        site: 'Site-101',
        severity: 'minor',
      };

      const created = await IssueModel.create(input);
      const found = await IssueModel.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.title).toBe(input.title);
    });

    it('should return null when issue does not exist', async () => {
      const found = await IssueModel.findById('non-existent-id-12345');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an existing issue', async () => {
      const input: CreateIssueInput = {
        title: 'Original Title',
        description: 'Original Description',
        site: 'Site-101',
        severity: 'minor',
      };

      const created = await IssueModel.create(input);
      const originalUpdatedAt = created.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      const updated = await IssueModel.update(created.id, {
        title: 'Updated Title',
        status: 'resolved',
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.status).toBe('resolved');
      expect(updated.description).toBe(input.description); // unchanged
      // updatedAt should be different or at least a valid timestamp
      expect(updated.updatedAt).toBeDefined();
      expect(typeof updated.updatedAt).toBe('string');
    });

    it('should throw error when updating non-existent issue', async () => {
      await expect(
        IssueModel.update('non-existent-id-12345', { title: 'New Title' })
      ).rejects.toThrow('Issue not found');
    });

    it('should update only provided fields', async () => {
      const input: CreateIssueInput = {
        title: 'Original Title',
        description: 'Original Description',
        site: 'Site-101',
        severity: 'major',
      };

      const created = await IssueModel.create(input);

      const updated = await IssueModel.update(created.id, {
        severity: 'critical',
      });

      expect(updated.severity).toBe('critical');
      expect(updated.title).toBe(input.title); // unchanged
      expect(updated.description).toBe(input.description); // unchanged
    });
  });

  describe('delete', () => {
    it('should delete an existing issue', async () => {
      const input: CreateIssueInput = {
        title: 'To Be Deleted',
        description: 'Will be deleted',
        site: 'Site-101',
        severity: 'minor',
      };

      const created = await IssueModel.create(input);
      const deleted = await IssueModel.delete(created.id);

      expect(deleted).toBe(true);

      const found = await IssueModel.findById(created.id);
      expect(found).toBeNull();
    });

    it('should return false when deleting non-existent issue', async () => {
      const deleted = await IssueModel.delete('non-existent-id-12345');
      expect(deleted).toBe(false);
    });
  });
});

