import { dynamoDBClient, TABLE_NAME } from '../config/dynamodb';
import { Issue, CreateIssueInput, UpdateIssueInput, PaginatedResponse } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { PutCommand, GetCommand, UpdateCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

export class IssueModel {
  async create(input: CreateIssueInput): Promise<Issue> {
    const id = uuidv4();
    const status = input.status || 'open';
    const now = new Date().toISOString();

    const issue: Issue = {
      id,
      title: input.title,
      description: input.description,
      site: input.site,
      severity: input.severity,
      status,
      createdAt: now,
      updatedAt: now,
    };

    await dynamoDBClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: issue,
      })
    );

    return issue;
  }

  async findById(id: string): Promise<Issue | null> {
    const result = await dynamoDBClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { id },
      })
    );

    if (!result.Item) {
      return null;
    }

    return result.Item as Issue;
  }

  async update(id: string, updates: UpdateIssueInput): Promise<Issue> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Issue not found');
    }

    const updateExpression: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (updates.title !== undefined) {
      updateExpression.push('#title = :title');
      expressionAttributeNames['#title'] = 'title';
      expressionAttributeValues[':title'] = updates.title;
    }
    if (updates.description !== undefined) {
      updateExpression.push('#description = :description');
      expressionAttributeNames['#description'] = 'description';
      expressionAttributeValues[':description'] = updates.description;
    }
    if (updates.site !== undefined) {
      updateExpression.push('#site = :site');
      expressionAttributeNames['#site'] = 'site';
      expressionAttributeValues[':site'] = updates.site;
    }
    if (updates.severity !== undefined) {
      updateExpression.push('#severity = :severity');
      expressionAttributeNames['#severity'] = 'severity';
      expressionAttributeValues[':severity'] = updates.severity;
    }
    if (updates.status !== undefined) {
      updateExpression.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = updates.status;
    }

    if (updateExpression.length === 0) {
      return existing;
    }

    // Always update updatedAt
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    await dynamoDBClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Failed to update issue');
    }

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await dynamoDBClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { id },
        ReturnValues: 'ALL_OLD',
      })
    );

    return !!result.Attributes;
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
    options?: {
      search?: string;
      status?: string;
      severity?: string;
      sortBy?: 'createdAt' | 'status' | 'severity';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<PaginatedResponse<Issue>> {
    // Scan the table (for small datasets, this is fine)
    // For larger datasets, consider using GSI or query patterns
    const result = await dynamoDBClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
      })
    );

    let allIssues = (result.Items || []) as Issue[];

    // Apply search filter (case-insensitive title search)
    if (options?.search) {
      const searchLower = options.search.toLowerCase();
      allIssues = allIssues.filter((issue) =>
        issue.title.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (options?.status) {
      allIssues = allIssues.filter((issue) => issue.status === options.status);
    }

    // Apply severity filter
    if (options?.severity) {
      allIssues = allIssues.filter((issue) => issue.severity === options.severity);
    }

    // Apply sorting
    const sortBy = options?.sortBy || 'createdAt';
    const sortOrder = options?.sortOrder || 'desc';

    allIssues.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'createdAt') {
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else if (sortBy === 'severity') {
        // Custom severity order: critical > major > minor
        const severityOrder: Record<string, number> = {
          critical: 3,
          major: 2,
          minor: 1,
        };
        comparison = severityOrder[a.severity] - severityOrder[b.severity];
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Calculate pagination
    const total = allIssues.length;
    const offset = (page - 1) * pageSize;
    const issues = allIssues.slice(offset, offset + pageSize);
    const totalPages = Math.ceil(total / pageSize);

    return {
      data: issues,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }
}

export default new IssueModel();
