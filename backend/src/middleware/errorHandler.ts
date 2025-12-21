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
  
  // Handle AggregateError (from Promise.allSettled/all with multiple failures)
  // Common case: AWS SDK connection errors trying both IPv6 and IPv4
  let message = err.message || 'Internal server error';
  if (err.name === 'AggregateError' && (err as any).errors) {
    const aggregateErr = err as any;
    // Extract unique error messages from the aggregate
    const errorMessages = aggregateErr.errors
      .map((e: Error) => e?.message || String(e))
      .filter((msg: string) => msg);
    
    // If all errors are connection errors, show a clearer message
    const connectionErrors = errorMessages.filter((msg: string) => 
      msg.includes('ECONNREFUSED') || msg.includes('connect')
    );
    if (connectionErrors.length > 0) {
      // Check if it's a DynamoDB connection issue
      if (process.env.DYNAMODB_ENDPOINT || process.env.NODE_ENV === 'development') {
        message = `Cannot connect to DynamoDB at ${process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000'}. Make sure DynamoDB Local is running.`;
      } else {
        message = connectionErrors[0]; // Use first connection error
      }
    } else {
      message = errorMessages.join('; ') || message;
    }
  }

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

