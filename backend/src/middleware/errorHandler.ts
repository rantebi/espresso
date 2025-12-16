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

  // Show verbose errors in development or test mode
  const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
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

  // Add verbose information in dev mode
  if (isDev) {
    errorResponse.verbose = {
      statusCode,
      endpoint: `${req.method} ${req.path}`,
      timestamp: new Date().toISOString(),
      request: {
        method: req.method,
        url: req.url,
        path: req.path,
        query: req.query,
        params: req.params,
        body: req.body,
        headers: {
          'content-type': req.headers['content-type'],
          'user-agent': req.headers['user-agent'],
        },
      },
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
    };

    // Log detailed error to console
    console.error('═══════════════════════════════════════════════════════');
    console.error('ERROR HANDLED:', {
      statusCode,
      method: req.method,
      path: req.path,
      message: err.message,
      name: err.name,
    });
    console.error('Request Details:', {
      query: req.query,
      params: req.params,
      body: req.body,
    });
    if (err.stack) {
      console.error('Stack Trace:', err.stack);
    }
    console.error('═══════════════════════════════════════════════════════');
  } else {
    // In production, only log error name and message
    console.error('Error:', {
      statusCode,
      name: err.name,
      message: err.message,
      path: req.path,
    });
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

