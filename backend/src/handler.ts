import serverless from 'serverless-http';
import app from './server';

// Wrap Express app with serverless-http for Lambda
// serverless-http automatically handles body parsing from API Gateway
export const handler = serverless(app, {
  binary: ['image/*', 'application/pdf'],
});

