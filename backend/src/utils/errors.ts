export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource tidak ditemukan') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Akses tidak sah. Silakan login terlebih dahulu') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Anda tidak memiliki hak akses untuk tindakan ini') {
    super(message, 403);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Permintaan tidak valid') {
    super(message, 400);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Konflik data terdeteksi') {
    super(message, 409);
  }
}
