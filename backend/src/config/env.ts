import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://gotix_user:gotix_password@localhost:5432/gotix_db?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_for_gotix_subtle_gothic_luxury_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  EXPIRY_INTERVAL_MS: parseInt(process.env.EXPIRY_INTERVAL_MS || process.env.EXPIRY_WORKER_INTERVAL_MS || '30000', 10),
  ORDER_EXPIRY_MINUTES: parseInt(process.env.ORDER_EXPIRY_MINUTES || '15', 10),
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'gotix_webhook_hmac_secret_key_2026',
};
