import { Request, Response, NextFunction } from 'express';
import IssueModel from '../models/Issue';
import { notFoundError } from '../middleware/errorHandler';
import { CreateIssueInput, UpdateIssueInput } from '../types';
import { parse } from 'csv-parse/sync';

export const createIssue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const input: CreateIssueInput = {
      title: req.body.title,
      description: req.body.description,
      site: req.body.site,
      severity: req.body.severity,
      status: req.body.status,
    };

    const issue = await IssueModel.create(input);

    res.status(201).json({
      success: true,
      data: issue,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadIssuesFromCSV = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please upload a CSV file',
      });
      return;
    }

    // Parse CSV file
    const csvContent = req.file.buffer.toString('utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true, // Allow rows with different column counts
      relax_quotes: true, // Allow unquoted values with quotes
    }) as Array<Record<string, string>>;

    if (records.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Empty CSV',
        message: 'The CSV file contains no data',
      });
      return;
    }

    // Validate and create issues
    const results = {
      success: [] as any[],
      errors: [] as any[],
    };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2; // +2 because row 1 is header, and arrays are 0-indexed

      try {
        // Map CSV columns to CreateIssueInput
        const title = row.title?.trim() || '';
        const description = row.description?.trim() || '';
        const site = row.site?.trim() || '';
        const severityStr = row.severity?.trim();
        const statusStr = row.status?.trim();
        const createdAtStr = row.createdAt?.trim();

        // Validate required fields
        if (!title || !description || !site || !severityStr) {
          results.errors.push({
            row: rowNumber,
            error: 'Missing required fields',
            data: row,
          });
          continue;
        }

        // Validate severity
        if (!['minor', 'major', 'critical'].includes(severityStr)) {
          results.errors.push({
            row: rowNumber,
            error: `Invalid severity: ${severityStr}. Must be minor, major, or critical`,
            data: row,
          });
          continue;
        }

        // Validate status if provided
        if (statusStr && !['open', 'in_progress', 'resolved'].includes(statusStr)) {
          results.errors.push({
            row: rowNumber,
            error: `Invalid status: ${statusStr}. Must be open, in_progress, or resolved`,
            data: row,
          });
          continue;
        }

        // Validate createdAt if provided (must be a valid ISO date string)
        let createdAt: string | undefined;
        if (createdAtStr) {
          const date = new Date(createdAtStr);
          if (isNaN(date.getTime())) {
            results.errors.push({
              row: rowNumber,
              error: `Invalid createdAt date: ${createdAtStr}. Must be a valid ISO date string`,
              data: row,
            });
            continue;
          }
          createdAt = date.toISOString();
        }

        const input: CreateIssueInput = {
          title,
          description,
          site,
          severity: severityStr as 'minor' | 'major' | 'critical',
          status: statusStr as 'open' | 'in_progress' | 'resolved' | undefined,
          createdAt,
        };

        // Create issue with createdAt from CSV if provided
        const issue = await IssueModel.create(input);
        results.success.push({
          row: rowNumber,
          issue,
        });
      } catch (error: any) {
        results.errors.push({
          row: rowNumber,
          error: error.message || 'Unknown error',
          data: row,
        });
      }
    }

    // Return results
    res.status(200).json({
      success: true,
      data: {
        total: records.length,
        created: results.success.length,
        failed: results.errors.length,
        issues: results.success.map((r) => r.issue),
        errors: results.errors,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllIssues = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Query params are validated and converted by middleware (with defaults applied)
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const severity = req.query.severity as string | undefined;
    const sortBy = (req.query.sortBy as 'createdAt' | 'status' | 'severity') || 'createdAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    const result = await IssueModel.findAll(page, pageSize, {
      search,
      status,
      severity,
      sortBy,
      sortOrder,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getIssueStatistics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const statistics = await IssueModel.getStatistics();

    res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
};

export const getIssueById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    const issue = await IssueModel.findById(id);

    if (!issue) {
      throw notFoundError('Issue');
    }

    res.status(200).json({
      success: true,
      data: issue,
    });
  } catch (error) {
    next(error);
  }
};

export const updateIssue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    const updates: UpdateIssueInput = {};
    
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.site !== undefined) updates.site = req.body.site;
    if (req.body.severity !== undefined) updates.severity = req.body.severity;
    if (req.body.status !== undefined) updates.status = req.body.status;

    const issue = await IssueModel.update(id, updates);

    res.status(200).json({
      success: true,
      data: issue,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Issue not found') {
      throw notFoundError('Issue');
    }
    next(error);
  }
};

export const deleteIssue = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id;

    const deleted = await IssueModel.delete(id);

    if (!deleted) {
      throw notFoundError('Issue');
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
