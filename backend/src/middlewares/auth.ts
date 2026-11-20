import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { AuthRequest, AuthenticatedUser } from '../types';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { ENV } from '../config/env';

export const authenticate = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token autentikasi tidak ditemukan');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (_err) {
    throw new UnauthorizedError('Token tidak valid atau telah kedaluwarsa');
  }
};

export const authorize = (allowedRoles: Role[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Silakan login terlebih dahulu');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError('Akses ditolak: role Anda tidak memiliki izin');
    }

    next();
  };
};
