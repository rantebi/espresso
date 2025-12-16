import express, { Request, Response } from 'express';
import { initializeDatabase, closeDatabase } from './config/database';
import apiRoutes from './routes/api';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initializeDatabase();

// Middleware
app.use(express.json());

// CORS middleware (allow all origins for development)
app.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Error handler middleware (must be last)
app.use(errorHandler);

// Start server only if not in test mode
let server: ReturnType<typeof app.listen> | null = null;

if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    if (server) {
      server.close(() => {
        console.log('HTTP server closed');
        closeDatabase();
        process.exit(0);
      });
    }
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    if (server) {
      server.close(() => {
        console.log('HTTP server closed');
        closeDatabase();
        process.exit(0);
      });
    }
  });
}

export default app;
export { server };

