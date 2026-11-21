import crypto from 'crypto';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { BadRequestError, ConflictError, GoneError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { generateUniqueTicketCode } from '../utils/codeGenerator';
import { ENV } from '../config/env';
import { expireOverdueOrders } from '../workers/expiry.worker';

export class PaymentService {
  /**
   * Fungsi inti bersama (Shared Service) untuk penyelesaian pembayaran pesanan.
   * Digunakan oleh:
   * 1. POST /api/orders/:id/pay (Simulasi pembayaran pengguna)
   * 2. POST /api/webhooks/payment (Notifikasi webhook gateway eksternal)
   *
   * Menjamin:
   * - Transisi atomik PENDING_PAYMENT -> PAID (hanya jika expiresAt > now).
   * - Pengembalian error jika expired, dibatalkan, atau sudah dibayar.
   * - Penerbitan tiket unik dengan kode acak dan proteksi UNIQUE (orderItemId, seq).
   * - Tidak ada penerbitan tiket ganda pada eksekusi konkuren.
   */
  static async settleOrderPayment(
    orderId: string,
    now: Date = new Date(),
    options?: {
      paymentMethod?: string;
      userId?: string;
    }
  ) {
    return await prisma.$transaction(
      async (tx) => {
        // 1. Ambil data pesanan
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: {
            items: true,
          },
        });

        if (!order) {
          throw new NotFoundError('Pesanan tidak ditemukan');
        }

        // Validasi pemilik pesanan jika userId diberikan
        if (options?.userId && order.userId !== options.userId) {
          throw new UnauthorizedError('Anda tidak memiliki akses untuk membayar pesanan ini');
        }

        // Cek jika sudah dibayar
        if (order.status === OrderStatus.PAID) {
          throw new ConflictError('Pesanan sudah pernah dibayar sebelumnya');
        }

        // Cek jika sudah dibatalkan
        if (order.status === OrderStatus.CANCELLED) {
          throw new ConflictError('Pesanan sudah dibatalkan dan tidak dapat dibayar');
        }

        // Cek jika kedaluwarsa (Lazy Expiry)
        if (order.status === OrderStatus.EXPIRED || now >= order.expiresAt) {
          if (order.status === OrderStatus.PENDING_PAYMENT) {
            // Jalankan expiry atomik segera
            const expResult = await tx.$executeRaw`
              UPDATE "Order"
              SET status = 'EXPIRED'::"OrderStatus",
                  "updatedAt" = NOW()
              WHERE id = ${order.id} AND status = 'PENDING_PAYMENT'::"OrderStatus"
            `;

            if (expResult === 1) {
              for (const item of order.items) {
                await tx.$executeRaw`
                  UPDATE "TicketType"
                  SET "reservedCount" = GREATEST(0, "reservedCount" - ${item.quantity}),
                      "updatedAt" = NOW()
                  WHERE id = ${item.ticketTypeId}
                `;
              }
            }
          }
          throw new GoneError('Pesanan telah kedaluwarsa (melebihi batas waktu 15 menit)');
        }

        // 2. Transisi atomik status ke PAID bersyarat (hanya jika PENDING_PAYMENT dan belum expired)
        const updateResult = await tx.$executeRaw`
          UPDATE "Order"
          SET status = 'PAID'::"OrderStatus",
              "paidAt" = ${now},
              "updatedAt" = NOW()
          WHERE id = ${order.id}
            AND status = 'PENDING_PAYMENT'::"OrderStatus"
            AND "expiresAt" > ${now}
        `;

        if (updateResult === 0) {
          throw new ConflictError('Gagal memproses pembayaran: status pesanan telah berubah atau kedaluwarsa');
        }

        // 3. Catat pembayaran di tabel Payment
        const payment = await tx.payment.create({
          data: {
            orderId: order.id,
            amount: order.totalAmount,
            status: PaymentStatus.SUCCESS,
            paymentMethod: options?.paymentMethod || 'SIMULATED_BANK_TRANSFER',
            paidAt: now,
          },
        });

        // 4. Terbitkan tiket unik untuk tiap item pesanan (dengan urutan seq 1..N)
        for (const item of order.items) {
          for (let seq = 1; seq <= item.quantity; seq++) {
            await tx.ticket.create({
              data: {
                code: generateUniqueTicketCode(),
                orderId: order.id,
                orderItemId: item.id,
                seq,
                ticketTypeId: item.ticketTypeId,
                userId: order.userId,
                status: 'VALID',
                issuedAt: now,
              },
            });
          }
        }

        // Ambil tiket yang telah diterbitkan
        const issuedTickets = await tx.ticket.findMany({
          where: { orderId: order.id },
          include: { ticketType: true },
        });

        const updatedOrder = await tx.order.findUnique({
          where: { id: order.id },
          include: {
            event: true,
            items: { include: { ticketType: true } },
            payment: true,
            tickets: true,
          },
        });

        return {
          order: updatedOrder,
          payment,
          tickets: issuedTickets,
        };
      },
      {
        timeout: 15000,
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      }
    );
  }

  /**
   * Endpoint simulasi pembayaran (POST /api/orders/:id/pay)
   */
  static async simulatePayment(
    userId: string,
    orderId: string,
    data?: { paymentMethod?: string }
  ) {
    return await this.settleOrderPayment(orderId, new Date(), {
      paymentMethod: data?.paymentMethod || 'SIMULATED_INSTANT_PAYMENT',
      userId,
    });
  }

  /**
   * Memproses Webhook Pembayaran dari Gateway Eksternal dengan verifikasi HMAC SHA-256
   */
  static async handlePaymentWebhook(
    payload: {
      eventId: string;
      type: string;
      orderId: string;
      amount?: number;
      paymentMethod?: string;
    },
    rawSignature?: string,
    rawBody?: string
  ) {
    // 1. Verifikasi HMAC SHA-256 Signature jika disediakan
    if (rawSignature && rawBody) {
      const expectedSignature = crypto
        .createHmac('sha256', ENV.WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      const sigBuffer = Buffer.from(rawSignature);
      const expectedBuffer = Buffer.from(expectedSignature);

      if (
        sigBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
      ) {
        throw new UnauthorizedError('Signature webhook tidak valid (HMAC verification failed)');
      }
    }

    // 2. Cek idempotency key (eventId)
    const existingWebhook = await prisma.webhookEvent.findUnique({
      where: { eventId: payload.eventId },
    });

    if (existingWebhook) {
      return {
        duplicate: true,
        message: 'Webhook sudah pernah diterima dan diproses sebelumnya (Idempotent response)',
        eventId: payload.eventId,
      };
    }

    // Catat WebhookEvent
    await prisma.webhookEvent.create({
      data: {
        eventId: payload.eventId,
        eventType: payload.type || 'payment.succeeded',
        payload: payload as unknown as Prisma.InputJsonValue,
        status: 'PROCESSED',
      },
    });

    // 3. Cek status order sebelum memproses
    const order = await prisma.order.findUnique({
      where: { id: payload.orderId },
    });

    if (!order) {
      return {
        duplicate: false,
        status: 'ignored',
        message: 'Pesanan tidak ditemukan, webhook diabaikan',
      };
    }

    if (
      order.status === OrderStatus.PAID ||
      order.status === OrderStatus.CANCELLED ||
      order.status === OrderStatus.EXPIRED ||
      new Date() >= order.expiresAt
    ) {
      // Lazy expiry jika perlu
      if (order.status === OrderStatus.PENDING_PAYMENT && new Date() >= order.expiresAt) {
        await expireOverdueOrders();
      }

      return {
        duplicate: false,
        status: 'ignored',
        message: `Webhook diabaikan karena order sudah berstatus ${order.status}`,
      };
    }

    // 4. Selesaikan pembayaran
    await this.settleOrderPayment(payload.orderId, new Date(), {
      paymentMethod: payload.paymentMethod || 'GATEWAY_WEBHOOK',
    });

    return {
      duplicate: false,
      status: 'success',
      message: 'Pembayaran via webhook berhasil diselesaikan',
    };
  }
}
