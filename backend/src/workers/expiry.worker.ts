import { OrderStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';

/**
 * Worker untuk memproses seluruh order yang kedaluwarsa (> 15 menit).
 * Bekerja secara otomatis dan idempoten:
 * 1. Mengubah status order PENDING_PAYMENT yang melewati batas expiresAt menjadi EXPIRED secara atomik.
 * 2. Mengembalikan reservedCount pada TicketType HANYA jika transisi status berhasil mengenai 1 baris.
 * 3. Menerima parameter DI `now` untuk pengujian instan tanpa menunggu 15 menit.
 */
export async function expireOverdueOrders(now: Date = new Date()): Promise<number> {
  let expiredCount = 0;

  try {
    // Cari semua order PENDING_PAYMENT yang sudah melewati waktu expiresAt
    const overdueOrders = await prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING_PAYMENT,
        expiresAt: {
          lte: now,
        },
      },
      select: {
        id: true,
      },
    });

    for (const order of overdueOrders) {
      await prisma.$transaction(async (tx) => {
        // Transisi atomik: Hanya ubah status jika masih PENDING_PAYMENT
        const updateResult = await tx.$executeRaw`
          UPDATE "Order"
          SET status = 'EXPIRED'::"OrderStatus",
              "updatedAt" = NOW()
          WHERE id = ${order.id} AND status = 'PENDING_PAYMENT'::"OrderStatus"
        `;

        // Jika row affected == 0, berarti order telah dibayar atau dibatalkan oleh transaksi lain
        if (updateResult === 0) {
          return;
        }

        // Ambil item pesanan untuk memulihkan reservedCount
        const items = await tx.orderItem.findMany({
          where: { orderId: order.id },
        });

        // Pulihkan reservedCount di database
        for (const item of items) {
          await tx.$executeRaw`
            UPDATE "TicketType"
            SET "reservedCount" = GREATEST(0, "reservedCount" - ${item.quantity}),
                "updatedAt" = NOW()
            WHERE id = ${item.ticketTypeId}
          `;
        }

        expiredCount++;
      });
    }

    if (expiredCount > 0) {
      console.log(`[EXPIRY WORKER] Berhasil memproses ${expiredCount} pesanan kedaluwarsa pada ${now.toISOString()}`);
    }
  } catch (error: any) {
    if (error?.code === 'P1001' || error?.message?.includes("Can't reach database")) {
      console.warn('[EXPIRY WORKER] Menunggu koneksi database PostgreSQL...');
    } else {
      console.error('[EXPIRY WORKER ERROR]:', error?.message || error);
    }
  }

  return expiredCount;
}

// Alias untuk kompatibilitas
export const runExpiryCheck = expireOverdueOrders;

let workerIntervalId: NodeJS.Timeout | null = null;

export function startExpiryWorker(): void {
  if (workerIntervalId) {
    return;
  }

  console.log(`[EXPIRY WORKER] Menjalankan scheduler (interval: ${ENV.EXPIRY_INTERVAL_MS}ms)`);

  // Jalankan pemeriksaan segera saat startup
  expireOverdueOrders().catch((err) => console.error('[EXPIRY WORKER STARTUP ERROR]:', err));

  workerIntervalId = setInterval(() => {
    expireOverdueOrders().catch((err) => console.error('[EXPIRY WORKER TICK ERROR]:', err));
  }, ENV.EXPIRY_INTERVAL_MS);
}

export function stopExpiryWorker(): void {
  if (workerIntervalId) {
    clearInterval(workerIntervalId);
    workerIntervalId = null;
    console.log('[EXPIRY WORKER] Scheduler dihentikan dengan aman.');
  }
}
