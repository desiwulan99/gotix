import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { sendSuccess } from './utils/response';

export const createApp = (): Application => {
  const app = express();

  // Middleware dasar
  app.use(cors({
    origin: ENV.CORS_ORIGIN,
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    sendSuccess(res, 'GOTIX API is healthy and operational', {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: ENV.NODE_ENV,
    });
  });

  // REST API Routes
  app.use('/api', routes);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint tidak ditemukan',
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp();
