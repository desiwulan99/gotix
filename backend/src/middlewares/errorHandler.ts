import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';
import { ENV } from '../config/env';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  // 1. Error dari validasi Zod
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 'Validasi input gagal', 400, 'VALIDATION_ERROR', formattedErrors);
  }

  // 2. Error operasional AppError
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.code, err.details);
  }

  // 3. Error tak terduga (Internal Server Error)
  console.error('[UNHANDLED ERROR]:', err);
  const message = ENV.NODE_ENV === 'production'
    ? 'Terjadi kesalahan internal pada server'
    : err.message || 'Internal Server Error';

  return sendError(
    res,
    message,
    500,
    'INTERNAL_SERVER_ERROR',
    ENV.NODE_ENV === 'production' ? undefined : err.stack
  );
};
