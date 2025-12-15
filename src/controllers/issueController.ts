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

