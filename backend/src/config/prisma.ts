import { PrismaClient } from '@prisma/client';

// Inisialisasi Prisma Client tunggal (Singleton) agar tidak membuat koneksi berlebih ke database
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;
