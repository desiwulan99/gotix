import { createApp } from './app';
import { ENV } from './config/env';
import { prisma } from './config/prisma';
import { startExpiryWorker, stopExpiryWorker } from './workers/expiry.worker';

const app = createApp();

const server = app.listen(ENV.PORT, async () => {
  console.log(`=========================================`);
  console.log(`  GOTIX API SERVER — Unlock the Unknown  `);
  console.log(`=========================================`);
  console.log(`  Environment : ${ENV.NODE_ENV}`);
  console.log(`  Port        : ${ENV.PORT}`);
  console.log(`  Health Check: http://localhost:${ENV.PORT}/health`);
  console.log(`=========================================`);

  try {
    await prisma.$connect();
    console.log('[DATABASE] Berhasil terhubung ke database PostgreSQL.');
  } catch (_err) {
    console.warn('[DATABASE] PostgreSQL belum terdeteksi aktif di port 5432.');
    console.warn('[DATABASE] Silakan jalankan `docker-compose up -d postgres` untuk menyalakan database.');
  }

  // Mulai background worker untuk expiry pesanan 15 menit
  startExpiryWorker();
});

// Penanganan Graceful Shutdown
const handleShutdown = async (signal: string) => {
  console.log(`\n[${signal}] Menutup server GOTIX dengan aman...`);
  stopExpiryWorker();

  server.close(async () => {
    console.log('[SERVER] Koneksi HTTP dihentikan.');
    await prisma.$disconnect();
    console.log('[DATABASE] Koneksi Prisma diputus.');
    process.exit(0);
  });

  // Paksa berhenti jika proses shutdown melebihi 10 detik
  setTimeout(() => {
    console.error('[SHUTDOWN] Waktu shutdown habis, keluar paksa.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
