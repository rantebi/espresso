import { getDatabase } from '../config/database';
import { Issue, CreateIssueInput, UpdateIssueInput } from '../types';

export class IssueModel {
  private get db() {
    return getDatabase();
  }

  async create(input: CreateIssueInput): Promise<Issue> {
    const status = input.status || 'open';
    
    const stmt = this.db.prepare(`
      INSERT INTO issues (title, description, site, severity, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      input.title,
      input.description,
      input.site,
      input.severity,
      status
    );

    const issue = await this.findById(result.lastInsertRowid as number);
    if (!issue) {
      throw new Error('Failed to create issue');
    }

    return issue;
  }

  async findById(id: number): Promise<Issue | null> {
    const stmt = this.db.prepare('SELECT * FROM issues WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      site: row.site,
      severity: row.severity,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async update(id: number, updates: UpdateIssueInput): Promise<Issue> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Issue not found');
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.site !== undefined) {
      fields.push('site = ?');
      values.push(updates.site);
    }
    if (updates.severity !== undefined) {
      fields.push('severity = ?');
      values.push(updates.severity);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }

    if (fields.length === 0) {
      return existing;
    }

    fields.push('updatedAt = CURRENT_TIMESTAMP');

    const stmt = this.db.prepare(`
      UPDATE issues 
      SET ${fields.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values, id);

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Failed to update issue');
    }

    return updated;
  }

  async delete(id: number): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM issues WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}

export default new IssueModel();

