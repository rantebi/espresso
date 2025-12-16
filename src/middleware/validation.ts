import { body, param, query, ValidationChain, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateCreateIssue: ValidationChain[] = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage((value) => {
      if (value === undefined || value === null) {
        return 'Title is required but was not provided';
      }
      if (typeof value !== 'string') {
        return `Title must be a string. Received: ${JSON.stringify(value)} (type: ${typeof value})`;
      }
      if (value.trim().length === 0) {
        return 'Title cannot be empty or whitespace only';
      }
      return 'Title is required';
    })
    .isString()
    .withMessage((value) => `Title must be a string. Received: ${JSON.stringify(value)} (type: ${typeof value})`)
    .isLength({ max: 255 })
    .withMessage((value) => `Title must be at most 255 characters. Received ${value.length} characters`),
  body('description')
    .trim()
    .notEmpty()
    .withMessage((value) => {
      if (value === undefined || value === null) {
        return 'Description is required but was not provided';
      }
      if (typeof value !== 'string') {
        return `Description must be a string. Received: ${JSON.stringify(value)} (type: ${typeof value})`;
      }
      if (value.trim().length === 0) {
        return 'Description cannot be empty or whitespace only';
      }
      return 'Description is required';
    })
    .isString()
    .withMessage((value) => `Description must be a string. Received: ${JSON.stringify(value)} (type: ${typeof value})`),
  body('site')
    .trim()
    .notEmpty()
    .withMessage((value) => {
      if (value === undefined || value === null) {
        return 'Site is required but was not provided';
      }
      if (typeof value !== 'string') {
        return `Site must be a string. Received: ${JSON.stringify(value)} (type: ${typeof value})`;
      }
      if (value.trim().length === 0) {
        return 'Site cannot be empty or whitespace only';
      }
      return 'Site is required';
    })
    .isString()
    .withMessage((value) => `Site must be a string. Received: ${JSON.stringify(value)} (type: ${typeof value})`),
  body('severity')
    .notEmpty()
    .withMessage((value) => {
      if (value === undefined || value === null) {
        return 'Severity is required but was not provided';
      }
      return `Severity is required. Received: ${JSON.stringify(value)}`;
    })
    .isIn(['minor', 'major', 'critical'])
    .withMessage((value) => `Severity must be one of: 'minor', 'major', 'critical'. Received: "${value}"`),
  body('status')
    .optional()
    .isIn(['open', 'in_progress', 'resolved'])
    .withMessage((value) => `Status must be one of: 'open', 'in_progress', 'resolved'. Received: "${value}"`),
];

export const validateUpdateIssue: ValidationChain[] = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage((value) => {
      if (value === '') {
        return 'Title cannot be empty. If provided, it must contain non-whitespace characters';
      }
      return `Title cannot be empty. Received: "${value}"`;
    })
    .isString()
    .withMessage((value) => `Title must be a string. Received: ${JSON.stringify(value)} (type: ${typeof value})`)
    .isLength({ max: 255 })
    .withMessage((value) => `Title must be at most 255 characters. Received ${value.length} characters`),
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage((value) => {
      if (value === '') {
        return 'Description cannot be empty. If provided, it must contain non-whitespace characters';
      }
      return `Description cannot be empty. Received: "${value}"`;
    })
    .isString()
    .withMessage((value) => `Description must be a string. Received: ${JSON.stringify(value)} (type: ${typeof value})`),
  body('site')
    .optional()
    .trim()
    .notEmpty()
    .withMessage((value) => {
      if (value === '') {
        return 'Site cannot be empty. If provided, it must contain non-whitespace characters';
      }
      return `Site cannot be empty. Received: "${value}"`;
    })
    .isString()
    .withMessage((value) => `Site must be a string. Received: ${JSON.stringify(value)} (type: ${typeof value})`),
  body('severity')
    .optional()
    .isIn(['minor', 'major', 'critical'])
    .withMessage((value) => `Severity must be one of: 'minor', 'major', 'critical'. Received: "${value}"`),
  body('status')
    .optional()
    .isIn(['open', 'in_progress', 'resolved'])
    .withMessage((value) => `Status must be one of: 'open', 'in_progress', 'resolved'. Received: "${value}"`),
  body().custom((value) => {
    const hasAtLeastOneField = Object.keys(value).length > 0;
    if (!hasAtLeastOneField) {
      throw new Error('At least one field must be provided for update. Received empty body');
    }
    return true;
  }),
];

export const validateIssueId: ValidationChain[] = [
  param('id')
    .notEmpty()
    .withMessage((value) => `Issue ID is required. Received: ${value}`)
    .isInt({ min: 1 })
    .withMessage((value) => `Issue ID must be a positive integer. Received: "${value}" (type: ${typeof value})`)
    .toInt(),
];

export const validatePagination: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage((value) => {
      if (value === undefined || value === '') {
        return 'Page is optional, but if provided must be a positive integer';
      }
      return `Page must be a positive integer (>= 1). Received: "${value}" (type: ${typeof value})`;
    })
    .toInt(),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage((value) => {
      if (value === undefined || value === '') {
        return 'Page size is optional, but if provided must be between 1 and 100';
      }
      const num = Number(value);
      if (isNaN(num)) {
        return `Page size must be a number between 1 and 100. Received: "${value}" (not a number)`;
      }
      if (num < 1) {
        return `Page size must be at least 1. Received: ${num}`;
      }
      if (num > 100) {
        return `Page size must be at most 100. Received: ${num}`;
      }
      return `Page size must be between 1 and 100. Received: "${value}"`;
    })
    .toInt(),
];

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Show verbose errors in development or test mode
    const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
    const errorArray = errors.array();
    
    // Create a more detailed error message
    const errorMessages = errorArray.map((err: any) => {
      const field = err.type === 'field' ? err.path : err.param || err.location;
      return `${field}: ${err.msg}`;
    });

    const response: any = {
      success: false,
      error: 'Validation failed',
      message: `Validation failed with ${errorArray.length} error(s)`,
      details: errorArray,
    };

    // Add verbose information in dev mode
    if (isDev) {
      response.verbose = {
        errors: errorMessages,
        received: {
          body: req.body,
          params: req.params,
          query: req.query,
        },
        endpoint: `${req.method} ${req.path}`,
        timestamp: new Date().toISOString(),
      };
      
      // Log to console for debugging
      console.error('Validation Error:', {
        endpoint: `${req.method} ${req.path}`,
        errors: errorMessages,
        received: {
          body: req.body,
          params: req.params,
          query: req.query,
        },
      });
    }

    res.status(400).json(response);
    return;
  }
  next();
};

