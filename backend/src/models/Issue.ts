import { dynamoDBClient, TABLE_NAME } from '../config/dynamodb';
import { Issue, CreateIssueInput, UpdateIssueInput, PaginatedResponse } from '../types';
import { v4 as uuidv4 } from 'uuid';

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

    await dynamoDBClient.put({
      TableName: TABLE_NAME,
      Item: issue,
    });

    return issue;
  }

  async findById(id: string): Promise<Issue | null> {
    const result = await dynamoDBClient.get({
      TableName: TABLE_NAME,
      Key: { id },
    });

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

    await dynamoDBClient.update({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    });

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Failed to update issue');
    }

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await dynamoDBClient.delete({
      TableName: TABLE_NAME,
      Key: { id },
      ReturnValues: 'ALL_OLD',
    });

    return !!result.Attributes;
  }

  async findAll(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Issue>> {
    // Scan the table (for small datasets, this is fine)
    // For larger datasets, consider using GSI or query patterns
    const result = await dynamoDBClient.scan({
      TableName: TABLE_NAME,
    });

    const allIssues = (result.Items || []) as Issue[];

    // Sort by createdAt descending
    allIssues.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
