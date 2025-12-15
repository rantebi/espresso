import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  details?: any;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  const errorResponse: any = {
    success: false,
    error: message,
  };

  // Add details if available (e.g., validation errors)
  if (err.details) {
    errorResponse.details = err.details;
  }

  // Log error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', err);
  }

  res.status(statusCode).json(errorResponse);
};

export const createError = (
  message: string,
  statusCode: number = 500,
  details?: any
): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
};

export const notFoundError = (resource: string = 'Resource'): AppError => {
  return createError(`${resource} not found`, 404);
};

