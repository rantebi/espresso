import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Zod schemas
const severitySchema = z.enum(['minor', 'major', 'critical']);
const statusSchema = z.enum(['open', 'in_progress', 'resolved']);

export const createIssueSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required but was not provided')
    .trim()
    .min(1, 'Title cannot be empty or whitespace only')
    .max(255, 'Title must be at most 255 characters'),
  description: z
    .string()
    .min(1, 'Description is required but was not provided')
    .trim()
    .min(1, 'Description cannot be empty or whitespace only'),
  site: z
    .string()
    .min(1, 'Site is required but was not provided')
    .trim()
    .min(1, 'Site cannot be empty or whitespace only'),
  severity: severitySchema,
  status: statusSchema.optional(),
});

export const updateIssueSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title cannot be empty. If provided, it must contain non-whitespace characters')
      .max(255, 'Title must be at most 255 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .min(1, 'Description cannot be empty. If provided, it must contain non-whitespace characters')
      .optional(),
    site: z
      .string()
      .trim()
      .min(1, 'Site cannot be empty. If provided, it must contain non-whitespace characters')
      .optional(),
    severity: severitySchema.optional(),
    status: statusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update. Received empty body',
  });

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const issueIdSchema = z.object({
  id: z
    .string()
    .min(1, 'Issue ID is required')
    .refine(
      (val) => uuidRegex.test(val),
      `Issue ID must be a valid UUID`
    ),
});

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .superRefine((val, ctx) => {
      if (val === undefined || val === '') return;
      const num = Number(val);
      if (isNaN(num) || num < 1 || !Number.isInteger(num)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Page must be a positive integer (>= 1). Received: "${val}" (type: ${typeof val})`,
        });
      }
    })
    .transform((val) => (val ? Number(val) : 1)),
  pageSize: z
    .string()
    .optional()
    .superRefine((val, ctx) => {
      if (val === undefined || val === '') return;
      const num = Number(val);
      if (isNaN(num)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Page size must be a number between 1 and 100. Received: "${val}" (not a number)`,
        });
        return;
      }
      if (num < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Page size must be at least 1. Received: ${num}`,
        });
        return;
      }
      if (num > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Page size must be at most 100. Received: ${num}`,
        });
        return;
      }
      if (!Number.isInteger(num)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Page size must be an integer. Received: ${num}`,
        });
      }
    })
    .transform((val) => (val ? Number(val) : 10)),
  search: z
    .string()
    .optional()
    .transform((val) => (val && val.trim() ? val.trim() : undefined)),
  status: statusSchema.optional(),
  severity: severitySchema.optional(),
  sortBy: z
    .enum(['createdAt', 'status', 'severity'])
    .optional()
    .transform((val) => val || 'createdAt'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .transform((val) => val || 'desc'),
});

// Validation middleware factory
const validate = (schema: z.ZodSchema, source: 'body' | 'params' | 'query' = 'body') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = source === 'body' ? req.body : source === 'params' ? req.params : req.query;
      const result = await schema.parseAsync(data);
      
      // Replace the original data with validated/transformed data
      if (source === 'body') {
        req.body = result;
      } else if (source === 'params') {
        // Merge transformed values back into params
        Object.assign(req.params, result);
      } else {
        // Merge transformed values back into query
        Object.assign(req.query, result);
      }
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
        const requestData = source === 'body' ? req.body : source === 'params' ? req.params : req.query;
        
        // Format Zod errors - use Zod's default error messages
        const formattedErrors = error.issues.map((err) => {
          // Get the value from the path
          let value: any = requestData;
          for (const key of err.path) {
            value = value?.[key as string | number];
          }
          
          return {
            type: 'field',
            path: err.path.length > 0 ? err.path.join('.') : err.path[0]?.toString() || 'unknown',
            location: source,
            msg: err.message, // Use Zod's default error message
            value: value,
          };
        });

        const errorMessages = formattedErrors.map((err) => `${err.path}: ${err.msg}`);

        const response: any = {
          success: false,
          error: 'Validation failed',
          message: `Validation failed with ${formattedErrors.length} error(s)`,
          details: formattedErrors,
        };

        // Add verbose information in dev/test mode
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
      next(error);
    }
  };
};

// Export validation middleware
export const validateCreateIssue = validate(createIssueSchema, 'body');
export const validateUpdateIssue = validate(updateIssueSchema, 'body');
export const validateIssueId = validate(issueIdSchema, 'params');
export const validatePagination = validate(paginationSchema, 'query');

// Legacy export for backwards compatibility (not used anymore but kept for type safety)
export const handleValidationErrors = (_req: Request, _res: Response, next: NextFunction): void => {
  // This is a no-op now since Zod handles validation directly
  // Kept for backwards compatibility in case it's referenced elsewhere
  next();
};
