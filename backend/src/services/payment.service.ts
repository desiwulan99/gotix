import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { generateUniqueTicketCode } from '../utils/codeGenerator';

export class PaymentService {
  /**
   * Memproses simulasi pembayaran secara atomik & idempoten.
   * Hanya berhasil jika order berstatus PENDING_PAYMENT dan belum melewati batas expiresAt.
   * Mengubah reservedQuota menjadi paidQuota dan menerbitkan tiket unik.
   */
  static async simulatePayment(
    userId: string,
    orderId: string,
    data?: { paymentMethod?: string }
  ) {
    return await prisma.$transaction(
      async (tx) => {
        // 1. Kunci baris Order dengan FOR UPDATE
        const lockedOrders: Array<{
          id: string;
          userId: string;
          eventId: string;
          status: OrderStatus;
          totalAmount: Prisma.Decimal;
          expiresAt: Date;
        }> = await tx.$queryRaw`
          SELECT id, "userId", "eventId", status, "totalAmount", "expiresAt"
          FROM "Order"
          WHERE id = ${orderId}
          FOR UPDATE
        `;

        if (lockedOrders.length === 0) {
          throw new NotFoundError('Pesanan tidak ditemukan');
        }

        const order = lockedOrders[0];

        // Validasi kepemilikan pesanan
        if (order.userId !== userId) {
          throw new BadRequestError('Anda tidak memiliki akses untuk membayar pesanan ini');
        }

        // Validasi status
        if (order.status === OrderStatus.PAID) {
          throw new BadRequestError('Pesanan sudah pernah dibayar sebelumnya');
        }

        if (order.status === OrderStatus.CANCELLED) {
          throw new BadRequestError('Pesanan sudah dibatalkan dan tidak dapat dibayar');
        }

        if (order.status === OrderStatus.EXPIRED || new Date() > new Date(order.expiresAt)) {
          // Jika waktu telah habis tetapi status belum diupdate oleh background worker, update sekarang
          if (order.status === OrderStatus.PENDING_PAYMENT) {
            await this.expireSingleOrder(tx, order.id);
          }
          throw new BadRequestError('Pesanan telah kedaluwarsa (melebihi batas 15 menit)');
        }

        // 2. Ambil seluruh item pesanan
        const items = await tx.orderItem.findMany({
          where: { orderId: order.id },
        });

        // 3. Pindahkan kuota dari reservedQuota ke paidQuota secara atomik
        for (const item of items) {
          await tx.$executeRaw`
            UPDATE "TicketType"
            SET "reservedQuota" = GREATEST(0, "reservedQuota" - ${item.quantity}),
                "paidQuota" = "paidQuota" + ${item.quantity},
                "updatedAt" = NOW()
            WHERE id = ${item.ticketTypeId}
          `;
        }

        // 4. Ubah status Order menjadi PAID
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.PAID },
        });

        // 5. Catat pembayaran di tabel Payment
        const payment = await tx.payment.create({
          data: {
            orderId: order.id,
            amount: order.totalAmount,
            status: PaymentStatus.SUCCESS,
            paymentMethod: data?.paymentMethod || 'SIMULATED_INSTANT_PAYMENT',
            paidAt: new Date(),
          },
        });

        // 6. Terbitkan tiket unik untuk setiap tiket yang dibeli
        const ticketsToCreate: Array<{
          ticketCode: string;
          orderId: string;
          ticketTypeId: string;
          userId: string;
        }> = [];

        for (const item of items) {
          for (let i = 0; i < item.quantity; i++) {
            ticketsToCreate.push({
              ticketCode: generateUniqueTicketCode(),
              orderId: order.id,
              ticketTypeId: item.ticketTypeId,
              userId: order.userId,
            });
          }
        }

        await tx.ticket.createMany({
          data: ticketsToCreate,
        });

        // Ambil tiket yang baru dibuat
        const issuedTickets = await tx.ticket.findMany({
          where: { orderId: order.id },
          include: { ticketType: true },
        });

        return {
          orderId: order.id,
          status: OrderStatus.PAID,
          payment,
          tickets: issuedTickets,
        };
      },
      {
        timeout: 10000,
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      }
    );
  }

  /**
   * Menangani simulasi webhook pembayaran dari payment gateway dengan idempotency key (eventId).
   */
  static async handlePaymentWebhook(payload: {
    eventId: string;
    orderId: string;
    amount: number;
    paymentStatus: 'SUCCESS' | 'FAILED';
    paymentMethod: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      // 1. Cek Idempotency: Apakah eventId webhook ini sudah pernah diproses?
      const existingWebhook = await tx.webhookEvent.findUnique({
        where: { eventId: payload.eventId },
      });

      if (existingWebhook) {
        // Webhook duplikat diterima: kembalikan respon sukses tanpa proses ulang
        return {
          idempotent: true,
          message: 'Webhook sudah pernah diproses sebelumnya (Idempotent response)',
          webhookId: existingWebhook.id,
        };
      }

      // Catat webhook ke tabel WebhookEvent
      const recordedWebhook = await tx.webhookEvent.create({
        data: {
          eventId: payload.eventId,
          eventType: 'PAYMENT_STATUS_UPDATE',
          payload: payload as unknown as Prisma.InputJsonValue,
          status: 'PROCESSED',
        },
      });

      // 2. Kunci dan cek Order
      const lockedOrders: Array<{
        id: string;
        userId: string;
        status: OrderStatus;
        expiresAt: Date;
      }> = await tx.$queryRaw`
        SELECT id, "userId", status, "expiresAt"
        FROM "Order"
        WHERE id = ${payload.orderId}
        FOR UPDATE
      `;

      if (lockedOrders.length === 0) {
        throw new NotFoundError('Pesanan tidak ditemukan');
      }

      const order = lockedOrders[0];

      // Abaikan jika order sudah dibatalkan atau kedaluwarsa
      if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.EXPIRED) {
        return {
          idempotent: false,
          message: `Webhook diabaikan karena order berstatus ${order.status}`,
          webhookId: recordedWebhook.id,
        };
      }

      // Jika webhook status adalah SUCCESS dan order masih PENDING_PAYMENT
      if (payload.paymentStatus === 'SUCCESS' && order.status === OrderStatus.PENDING_PAYMENT) {
        const items = await tx.orderItem.findMany({
          where: { orderId: order.id },
        });

        // Pindahkan reservedQuota ke paidQuota
        for (const item of items) {
          await tx.$executeRaw`
            UPDATE "TicketType"
            SET "reservedQuota" = GREATEST(0, "reservedQuota" - ${item.quantity}),
                "paidQuota" = "paidQuota" + ${item.quantity},
                "updatedAt" = NOW()
            WHERE id = ${item.ticketTypeId}
          `;
        }

        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.PAID },
        });

        await tx.payment.create({
          data: {
            orderId: order.id,
            amount: new Prisma.Decimal(payload.amount),
            status: PaymentStatus.SUCCESS,
            paymentMethod: payload.paymentMethod,
            paidAt: new Date(),
          },
        });

        // Terbitkan tiket unik
        const ticketsToCreate = [];
        for (const item of items) {
          for (let i = 0; i < item.quantity; i++) {
            ticketsToCreate.push({
              ticketCode: generateUniqueTicketCode(),
              orderId: order.id,
              ticketTypeId: item.ticketTypeId,
              userId: order.userId,
            });
          }
        }

        await tx.ticket.createMany({ data: ticketsToCreate });
      }

      return {
        idempotent: false,
        message: 'Webhook pembayaran berhasil diproses',
        webhookId: recordedWebhook.id,
      };
    });
  }

  /**
   * Helper private untuk membatalkan kuota 1 order jika kedaluwarsa saat dicoba bayar
   */
  private static async expireSingleOrder(tx: Prisma.TransactionClient, orderId: string) {
    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      await tx.$executeRaw`
        UPDATE "TicketType"
        SET "reservedQuota" = GREATEST(0, "reservedQuota" - ${item.quantity}),
            "updatedAt" = NOW()
        WHERE id = ${item.ticketTypeId}
      `;
    }
    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.EXPIRED },
    });
  }
}
