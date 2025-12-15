import { Request, Response, NextFunction } from 'express';
import IssueModel from '../models/Issue';
import { notFoundError } from '../middleware/errorHandler';
import { CreateIssueInput, UpdateIssueInput } from '../types';

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

export const getAllIssues = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Parse query params, handling undefined and NaN
    const pageParam = req.query.page as string | undefined;
    const pageSizeParam = req.query.pageSize as string | undefined;
    
    const page = pageParam !== undefined ? parseInt(pageParam, 10) : 1;
    const pageSize = pageSizeParam !== undefined ? parseInt(pageSizeParam, 10) : 10;

    // Validate pagination params
    if (isNaN(page) || page < 1) {
      res.status(400).json({
        success: false,
        error: 'Page must be greater than 0',
      });
      return;
    }

    if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
      res.status(400).json({
        success: false,
        error: 'Page size must be between 1 and 100',
      });
      return;
    }

    const result = await IssueModel.findAll(page, pageSize);

    res.status(200).json({
      success: true,
      data: result,
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
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid issue ID',
      });
      return;
    }

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
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid issue ID',
      });
      return;
    }

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
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid issue ID',
      });
      return;
    }

    const deleted = await IssueModel.delete(id);

    if (!deleted) {
      throw notFoundError('Issue');
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

