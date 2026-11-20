import { OrderStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';

/**
 * Worker untuk memproses seluruh order yang kedaluwarsa (> 15 menit).
 * Bekerja secara otomatis dan idempoten:
 * 1. Mengubah status order PENDING_PAYMENT yang melewati batas expiresAt menjadi EXPIRED.
 * 2. Mengembalikan reservedQuota pada tipe tiket terkait secara atomik.
 * 3. Tidak akan memicu pengembalian kuota dobel jika dijalankan berulang kali.
 */
export async function runExpiryCheck(): Promise<number> {
  let expiredCount = 0;

  try {
    // Ambil semua order yang kedaluwarsa dan masih berstatus PENDING_PAYMENT
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING_PAYMENT,
        expiresAt: {
          lt: new Date(),
        },
      },
      select: {
        id: true,
      },
    });

    for (const expOrder of expiredOrders) {
      // Jalankan transaksi per order agar jika 1 gagal tidak membatalkan yang lain
      await prisma.$transaction(async (tx) => {
        // Kunci baris order untuk mencegah konflik dengan proses pembayaran yang bersamaan
        const lockedOrders: Array<{ id: string; status: OrderStatus }> = await tx.$queryRaw`
          SELECT id, status
          FROM "Order"
          WHERE id = ${expOrder.id} AND status = 'PENDING_PAYMENT'
          FOR UPDATE
        `;

        // Jika order sudah dibayar atau dibatalkan oleh transaksi lain, lewati
        if (lockedOrders.length === 0) {
          return;
        }

        const items = await tx.orderItem.findMany({
          where: { orderId: expOrder.id },
        });

        // Pulihkan reservedQuota
        for (const item of items) {
          await tx.$executeRaw`
            UPDATE "TicketType"
            SET "reservedQuota" = GREATEST(0, "reservedQuota" - ${item.quantity}),
                "updatedAt" = NOW()
            WHERE id = ${item.ticketTypeId}
          `;
        }

        // Ubah status order menjadi EXPIRED
        await tx.order.update({
          where: { id: expOrder.id },
          data: { status: OrderStatus.EXPIRED },
        });

        expiredCount++;
      });
    }

    if (expiredCount > 0) {
      console.log(`[EXPIRY WORKER] Berhasil memproses ${expiredCount} pesanan kedaluwarsa.`);
    }
  } catch (error) {
    console.error('[EXPIRY WORKER ERROR]:', error);
  }

  return expiredCount;
}

let workerIntervalId: NodeJS.Timeout | null = null;

export function startExpiryWorker(): void {
  if (workerIntervalId) {
    return;
  }

  console.log(`[EXPIRY WORKER] Menjalankan scheduler (interval: ${ENV.EXPIRY_WORKER_INTERVAL_MS}ms)`);
  
  // Jalankan pemeriksaan sekali saat startup aplikasi untuk menangani pesanan kedaluwarsa selama server offline
  runExpiryCheck();

  workerIntervalId = setInterval(() => {
    runExpiryCheck();
  }, ENV.EXPIRY_WORKER_INTERVAL_MS);
}

export function stopExpiryWorker(): void {
  if (workerIntervalId) {
    clearInterval(workerIntervalId);
    workerIntervalId = null;
    console.log('[EXPIRY WORKER] Worker dihentikan.');
  }
}
