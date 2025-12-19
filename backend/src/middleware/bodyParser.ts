import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to handle body parsing issues with serverless-http
 * serverless-http sometimes passes body as a string or Buffer instead of parsed JSON
 */
export const parseBody = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.body) {
    return next();
  }

  // Handle string bodies (common with serverless-http)
  if (typeof req.body === 'string') {
    const trimmed = req.body.trim();
    // Check if it looks like JSON
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        req.body = JSON.parse(req.body);
      } catch (e) {
        // If parsing fails, leave as is and let validation handle it
      }
    }
    return next();
  }

  // Handle Buffer instances
  if (Buffer.isBuffer(req.body)) {
    try {
      const bodyString = req.body.toString('utf-8');
      req.body = JSON.parse(bodyString);
    } catch (e) {
      // If parsing fails, convert to string
      req.body = req.body.toString('utf-8');
    }
    return next();
  }

  // Handle Buffer serialized as object {type: 'Buffer', data: [...]}
  if (
    typeof req.body === 'object' &&
    req.body.type === 'Buffer' &&
    Array.isArray(req.body.data)
  ) {
    try {
      const buffer = Buffer.from(req.body.data);
      const bodyString = buffer.toString('utf-8');
      req.body = JSON.parse(bodyString);
    } catch (e) {
      // If parsing fails, convert to string
      const buffer = Buffer.from(req.body.data);
      req.body = buffer.toString('utf-8');
    }
    return next();
  }

  next();
};

