import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { sendSuccess } from './utils/response';
import { prisma } from './config/prisma';

export const createApp = (): Application => {
  const app = express();

  // 1. Keamanan Header HTTP dengan Helmet
  app.use(helmet());

  // 2. Konfigurasi CORS
  app.use(
    cors({
      origin: ENV.CORS_ORIGIN,
      credentials: true,
    })
  );

  // 3. Body parser dengan penyimpanan rawBody untuk verifikasi signature HMAC webhook
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString();
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));

  // 4. Rate limiter ringan khusus untuk rute autentikasi
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 100, // Maksimal 100 request per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Terlalu banyak permintaan login/registrasi. Silakan coba beberapa saat lagi.',
      },
    },
  });
  app.use('/api/auth', authLimiter);

  // 5. Health check endpoint (memeriksa konektivitas PostgreSQL)
  const healthCheckHandler = async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      sendSuccess(res, {
        status: 'UP',
        database: 'CONNECTED',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: ENV.NODE_ENV,
      });
    } catch (err: any) {
      res.status(503).json({
        success: false,
        error: {
          code: 'DATABASE_DISCONNECTED',
          message: 'Server sedang tidak dapat terhubung ke database PostgreSQL',
          details: ENV.NODE_ENV === 'production' ? undefined : err?.message,
        },
      });
    }
  };

  app.get('/health', healthCheckHandler);
  app.get('/api/health', healthCheckHandler);

  // 6. REST API Routes
  app.use('/api', routes);

  // 7. 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint tidak ditemukan',
      },
    });
  });

  // 8. Centralized Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp();
