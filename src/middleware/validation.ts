import { body, param, query, ValidationChain, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateCreateIssue: ValidationChain[] = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .isLength({ max: 255 })
    .withMessage('Title must be at most 255 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isString()
    .withMessage('Description must be a string'),
  body('site')
    .trim()
    .notEmpty()
    .withMessage('Site is required')
    .isString()
    .withMessage('Site must be a string'),
  body('severity')
    .notEmpty()
    .withMessage('Severity is required')
    .isIn(['minor', 'major', 'critical'])
    .withMessage('Severity must be one of: minor, major, critical'),
  body('status')
    .optional()
    .isIn(['open', 'in_progress', 'resolved'])
    .withMessage('Status must be one of: open, in_progress, resolved'),
];

export const validateUpdateIssue: ValidationChain[] = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isString()
    .withMessage('Title must be a string')
    .isLength({ max: 255 })
    .withMessage('Title must be at most 255 characters'),
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty')
    .isString()
    .withMessage('Description must be a string'),
  body('site')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Site cannot be empty')
    .isString()
    .withMessage('Site must be a string'),
  body('severity')
    .optional()
    .isIn(['minor', 'major', 'critical'])
    .withMessage('Severity must be one of: minor, major, critical'),
  body('status')
    .optional()
    .isIn(['open', 'in_progress', 'resolved'])
    .withMessage('Status must be one of: open, in_progress, resolved'),
  body().custom((value) => {
    const hasAtLeastOneField = Object.keys(value).length > 0;
    if (!hasAtLeastOneField) {
      throw new Error('At least one field must be provided for update');
    }
    return true;
  }),
];

export const validateIssueId: ValidationChain[] = [
  param('id')
    .notEmpty()
    .withMessage('Issue ID is required')
    .isInt({ min: 1 })
    .withMessage('Issue ID must be a positive integer')
    .toInt(),
];

export const validatePagination: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Page size must be between 1 and 100')
    .toInt(),
];

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
    return;
  }
  next();
};

