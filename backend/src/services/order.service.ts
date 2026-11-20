import { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { ENV } from '../config/env';

export class OrderService {
  /**
   * Membuat reservasi tiket dengan proteksi concurrency-safe (Row-Level Locking).
   * Menjamin:
   * 1. 1 pesanan maksimal 4 tiket.
   * 2. 1 user maksimal memegang 4 tiket untuk event yang sama (gabungan PENDING_PAYMENT dan PAID).
   * 3. Kuota ditahan aman selama 15 menit.
   * 4. Dua request bersamaan tidak akan mengalami overselling.
   */
  static async createOrder(
    userId: string,
    data: {
      eventId: string;
      items: Array<{ ticketTypeId: string; quantity: number }>;
    }
  ) {
    // 1. Validasi batas pembelian per pesanan (1 s/d 4 tiket)
    const totalRequestedInOrder = data.items.reduce((sum, item) => sum + item.quantity, 0);
    if (totalRequestedInOrder < 1 || totalRequestedInOrder > 4) {
      throw new BadRequestError('Jumlah tiket per pesanan minimal 1 dan maksimal 4 tiket');
    }

    // 2. Jalankan transaksi database interaktif untuk concurrency-safety
    return await prisma.$transaction(
      async (tx) => {
        // A. Validasi batas maksimal 4 tiket per user untuk event ini
        // Ambil seluruh tiket aktif milik user pada event ini (order PENDING_PAYMENT atau PAID)
        const activeOrders = await tx.order.findMany({
          where: {
            userId,
            eventId: data.eventId,
            status: { in: [OrderStatus.PENDING_PAYMENT, OrderStatus.PAID] },
          },
          include: {
            items: true,
          },
        });

        const currentActiveTicketsCount = activeOrders.reduce((total, order) => {
          return total + order.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0);
        }, 0);

        if (currentActiveTicketsCount + totalRequestedInOrder > 4) {
          throw new BadRequestError(
            `Pembelian melebihi batas! Anda sudah memiliki ${currentActiveTicketsCount} tiket aktif untuk event ini. Batas maksimal adalah 4 tiket.`
          );
        }

        // B. Kunci baris TicketType dengan SELECT ... FOR UPDATE di PostgreSQL
        // dan validasi ketersediaan kuota secara atomik
        let totalAmount = new Prisma.Decimal(0);
        const orderItemsToCreate: Array<{
          ticketTypeId: string;
          quantity: number;
          unitPrice: Prisma.Decimal;
        }> = [];

        for (const item of data.items) {
          // Kunci baris spesifik ini dari pembacaan transaksi lain
          const lockedTicketTypes: Array<{
            id: string;
            name: string;
            price: Prisma.Decimal;
            totalQuota: number;
            reservedQuota: number;
            paidQuota: number;
          }> = await tx.$queryRaw`
            SELECT id, name, price, "totalQuota", "reservedQuota", "paidQuota"
            FROM "TicketType"
            WHERE id = ${item.ticketTypeId} AND "eventId" = ${data.eventId}
            FOR UPDATE
          `;

          if (lockedTicketTypes.length === 0) {
            throw new NotFoundError(`Tipe tiket dengan ID ${item.ticketTypeId} tidak ditemukan`);
          }

          const ticketType = lockedTicketTypes[0];
          const availableQuota = ticketType.totalQuota - (ticketType.reservedQuota + ticketType.paidQuota);

          if (availableQuota < item.quantity) {
            throw new BadRequestError(
              `Kuota tiket '${ticketType.name}' tidak mencukupi. Sisa tersedia: ${Math.max(0, availableQuota)}`
            );
          }

          // Tambah reservedQuota secara atomik
          await tx.$executeRaw`
            UPDATE "TicketType"
            SET "reservedQuota" = "reservedQuota" + ${item.quantity},
                "updatedAt" = NOW()
            WHERE id = ${item.ticketTypeId}
          `;

          const itemTotal = new Prisma.Decimal(ticketType.price).mul(item.quantity);
          totalAmount = totalAmount.add(itemTotal);

          orderItemsToCreate.push({
            ticketTypeId: item.ticketTypeId,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(ticketType.price),
          });
        }

        // C. Tentukan waktu kedaluwarsa 15 menit
        const expiresAt = new Date(Date.now() + ENV.ORDER_EXPIRY_MINUTES * 60 * 1000);

        // D. Buat Order dan OrderItems
        const order = await tx.order.create({
          data: {
            userId,
            eventId: data.eventId,
            status: OrderStatus.PENDING_PAYMENT,
            totalAmount,
            expiresAt,
            items: {
              create: orderItemsToCreate,
            },
          },
          include: {
            items: {
              include: {
                ticketType: true,
              },
            },
            event: true,
          },
        });

        return order;
      },
      {
        timeout: 10000, // Timeout transaksi 10 detik
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      }
    );
  }

  /**
   * Membatalkan pesanan yang belum dibayar dan mengembalikan kuota secara aman (Idempotent).
   */
  static async cancelOrder(userId: string, orderId: string, isAdmin = false) {
    return await prisma.$transaction(async (tx) => {
      // Kunci baris Order dengan FOR UPDATE
      const lockedOrders: Array<{
        id: string;
        userId: string;
        status: OrderStatus;
      }> = await tx.$queryRaw`
        SELECT id, "userId", status
        FROM "Order"
        WHERE id = ${orderId}
        FOR UPDATE
      `;

      if (lockedOrders.length === 0) {
        throw new NotFoundError('Pesanan tidak ditemukan');
      }

      const order = lockedOrders[0];

      if (!isAdmin && order.userId !== userId) {
        throw new BadRequestError('Anda tidak memiliki akses untuk membatalkan pesanan ini');
      }

      if (order.status !== OrderStatus.PENDING_PAYMENT) {
        throw new BadRequestError(`Pesanan tidak dapat dibatalkan karena berstatus ${order.status}`);
      }

      // Ambil items pesanan untuk memulihkan reservedQuota
      const items = await tx.orderItem.findMany({
        where: { orderId },
      });

      // Kembalikan kuota yang ditahan (reservedQuota - qty)
      for (const item of items) {
        await tx.$executeRaw`
          UPDATE "TicketType"
          SET "reservedQuota" = GREATEST(0, "reservedQuota" - ${item.quantity}),
              "updatedAt" = NOW()
          WHERE id = ${item.ticketTypeId}
        `;
      }

      // Update status order menjadi CANCELLED
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
        include: { items: true },
      });

      return updatedOrder;
    });
  }

  /**
   * Mengambil riwayat pesanan milik user
   */
  static async getUserOrders(userId: string) {
    return await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        event: true,
        items: {
          include: {
            ticketType: true,
          },
        },
        payment: true,
        tickets: true,
      },
    });
  }

  /**
   * Mengambil semua pesanan untuk admin dashboard
   */
  static async getAllOrders() {
    return await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, fullName: true },
        },
        event: true,
        items: {
          include: {
            ticketType: true,
          },
        },
        payment: true,
        tickets: true,
      },
    });
  }

  /**
   * Mengambil detail satu pesanan berdasarkan ID
   */
  static async getOrderById(userId: string, orderId: string, isAdmin = false) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        event: true,
        items: {
          include: {
            ticketType: true,
          },
        },
        payment: true,
        tickets: true,
      },
    });

    if (!order) {
      throw new NotFoundError('Pesanan tidak ditemukan');
    }

    if (!isAdmin && order.userId !== userId) {
      throw new BadRequestError('Anda tidak memiliki akses ke pesanan ini');
    }

    return order;
  }
}
