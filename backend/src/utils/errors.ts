export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource tidak ditemukan', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Akses tidak sah. Silakan login terlebih dahulu', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Anda tidak memiliki hak akses untuk tindakan ini', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Permintaan tidak valid', code = 'BAD_REQUEST', details?: unknown) {
    super(message, 400, code, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Konflik data terdeteksi', code = 'CONFLICT') {
    super(message, 409, code);
  }
}

export class SoldOutError extends AppError {
  constructor(message = 'Kuota tiket telah habis terjual (SOLD OUT)', code = 'SOLD_OUT') {
    super(message, 409, code);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = 'Entitas tidak dapat diproses', code = 'UNPROCESSABLE_ENTITY', details?: unknown) {
    super(message, 422, code, details);
  }
}

export class GoneError extends AppError {
  constructor(message = 'Pesanan telah kedaluwarsa', code = 'ORDER_EXPIRED') {
    super(message, 410, code);
  }
}
