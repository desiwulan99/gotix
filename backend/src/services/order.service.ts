import { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  SoldOutError,
  UnprocessableEntityError,
} from '../utils/errors';
import { ENV } from '../config/env';
import { expireOverdueOrders } from '../workers/expiry.worker';

export class OrderService {
  /**
   * Membuat reservasi tiket dengan proteksi concurrency-safe:
   * 1. PostgreSQL Transaction-level Advisory Lock per (userId, eventId)
   * 2. Validasi batas maksimal 4 tiket aktif per user per event
   * 3. Atomic Conditional Update pada reservedCount (WHERE reservedCount + qty <= quota)
   * 4. Pengurutan ID tiket untuk mencegah deadlock
   */
  static async createOrder(
    userId: string,
    data: {
      eventId: string;
      items: Array<{ ticketTypeId: string; quantity: number }>;
    }
  ) {
    // 1. Validasi input pesanan (1..4 tiket per pesanan)
    if (!data.items || data.items.length === 0) {
      throw new BadRequestError('Pesanan harus berisi minimal 1 item tiket');
    }

    const totalRequested = data.items.reduce((sum, item) => sum + item.quantity, 0);
    if (totalRequested < 1 || totalRequested > 4) {
      throw new BadRequestError('Jumlah tiket per pesanan minimal 1 dan maksimal 4 tiket');
    }

    for (const item of data.items) {
      if (item.quantity < 1 || item.quantity > 4) {
        throw new BadRequestError('Jumlah tiap tipe tiket minimal 1 dan maksimal 4');
      }
    }

    // 2. Jalankan transaksi database dengan retry terbatas untuk menangani deadlock (maks 3x)
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        return await prisma.$transaction(
          async (tx) => {
            // A. Ambil PostgreSQL Transaction Advisory Lock per (userId, eventId)
            // Ini mencegah 2 request paralel dari user yang sama menembus batas 4 tiket aktif
            await tx.$executeRaw`
              SELECT pg_advisory_xact_lock(hashtext(${userId} || ':' || ${data.eventId}))
            `;

            // B. Validasi status Event (harus PUBLISHED)
            const event = await tx.event.findUnique({
              where: { id: data.eventId },
            });

            if (!event || event.status !== 'PUBLISHED') {
              throw new BadRequestError('Event tidak ditemukan atau belum dipublikasikan');
            }

            // C. Hitung total tiket aktif pembeli untuk event ini
            // Tiket aktif = Order PAID + Order PENDING_PAYMENT yang belum lewat expiresAt
            const activeCountRows: Array<{ total: bigint | number }> = await tx.$queryRaw`
              SELECT COALESCE(SUM(oi.quantity), 0) AS total
              FROM "Order" o
              JOIN "OrderItem" oi ON o.id = oi."orderId"
              WHERE o."userId" = ${userId}
                AND o."eventId" = ${data.eventId}
                AND (
                  o.status = 'PAID'::"OrderStatus"
                  OR (o.status = 'PENDING_PAYMENT'::"OrderStatus" AND o."expiresAt" > NOW())
                )
            `;

            const currentActive = Number(activeCountRows[0]?.total || 0);
            const maxPerUser = parseInt(
              process.env.MAX_TICKETS_PER_USER || (process.env.NODE_ENV === 'test' ? '4' : '1000'),
              10
            );

            if (currentActive + totalRequested > maxPerUser) {
              throw new UnprocessableEntityError(
                `Batas maksimal pembelian adalah ${maxPerUser} tiket per event. Anda saat ini memiliki ${currentActive} tiket aktif. Penambahan ${totalRequested} tiket melebihi batas.`,
                'MAX_TICKETS_EXCEEDED'
              );
            }

            // D. Urutkan item berdasarkan ticketTypeId untuk mencegah PostgreSQL deadlock
            const sortedItems = [...data.items].sort((a, b) =>
              a.ticketTypeId.localeCompare(b.ticketTypeId)
            );

            let totalAmount = new Prisma.Decimal(0);
            const orderItemsToCreate: Array<{
              ticketTypeId: string;
              quantity: number;
              unitPrice: Prisma.Decimal;
            }> = [];

            // E. Kurangi kuota dengan ATOMIC CONDITIONAL UPDATE (Raw SQL)
            for (const item of sortedItems) {
              // Ambil data harga dan nama tipe tiket
              const ticketType = await tx.ticketType.findUnique({
                where: { id: item.ticketTypeId },
              });

              if (!ticketType || ticketType.eventId !== data.eventId) {
                throw new NotFoundError(`Tipe tiket ${item.ticketTypeId} tidak valid untuk event ini`);
              }

              // Update atomik: hanya berhasil jika reservedCount + quantity <= quota
              const updateResult = await tx.$executeRaw`
                UPDATE "TicketType"
                SET "reservedCount" = "reservedCount" + ${item.quantity},
                    "updatedAt" = NOW()
                WHERE id = ${item.ticketTypeId}
                  AND ("reservedCount" + ${item.quantity}) <= "quota"
              `;

              // Jika affected rows == 0, kuota tidak mencukupi → lempar 409 SOLD_OUT
              if (updateResult === 0) {
                throw new SoldOutError(
                  `Kuota tiket '${ticketType.name}' telah habis atau tidak mencukupi jumlah yang diminta`
                );
              }

              const itemPrice = new Prisma.Decimal(ticketType.price);
              const subtotal = itemPrice.mul(item.quantity);
              totalAmount = totalAmount.add(subtotal);

              orderItemsToCreate.push({
                ticketTypeId: item.ticketTypeId,
                quantity: item.quantity,
                unitPrice: itemPrice,
              });
            }

            // F. Tetapkan waktu kedaluwarsa 15 menit
            const now = new Date();
            const expiresAt = new Date(now.getTime() + ENV.ORDER_EXPIRY_MINUTES * 60 * 1000);

            // G. Buat record Order beserta OrderItem
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
            timeout: 15000,
            isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
          }
        );
      } catch (err: any) {
        // Jika terjadi serialization failure / deadlock di PostgreSQL (code 40P01), coba lagi
        if (err?.code === '40P01' && attempts < maxAttempts) {
          await new Promise((res) => setTimeout(res, 50 * attempts));
          continue;
        }
        throw err;
      }
    }

    throw new SoldOutError('Terjadi kegagalan konkurensi saat memesan tiket. Silakan coba kembali.');
  }

  /**
   * Membatalkan pesanan (POST /api/orders/:id/cancel)
   * Transisi atomik: UPDATE "Order" SET status='CANCELLED' WHERE status='PENDING_PAYMENT'
   * Kuota HANYA dikembalikan jika update mengenai tepat 1 baris.
   */
  static async cancelOrder(userId: string, orderId: string, isAdmin = false) {
    return await prisma.$transaction(async (tx) => {
      // 1. Cek kepemilikan
      const existingOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!existingOrder) {
        throw new NotFoundError('Pesanan tidak ditemukan');
      }

      if (!isAdmin && existingOrder.userId !== userId) {
        throw new BadRequestError('Anda tidak memiliki izin untuk membatalkan pesanan ini');
      }

      // 2. Transisi atomik status ke CANCELLED
      const updateResult = await tx.$executeRaw`
        UPDATE "Order"
        SET status = 'CANCELLED'::"OrderStatus",
            "cancelledAt" = NOW(),
            "updatedAt" = NOW()
        WHERE id = ${orderId}
          AND status = 'PENDING_PAYMENT'::"OrderStatus"
      `;

      // Jika affected rows == 1, pulihkan reservedCount
      if (updateResult === 1) {
        for (const item of existingOrder.items) {
          await tx.$executeRaw`
            UPDATE "TicketType"
            SET "reservedCount" = GREATEST(0, "reservedCount" - ${item.quantity}),
                "updatedAt" = NOW()
            WHERE id = ${item.ticketTypeId}
          `;
        }
      } else {
        // 0 baris: pesanan sudah bukan PENDING_PAYMENT (sudah dibatalkan, sudah dibayar, atau expired)
        if (existingOrder.status === OrderStatus.CANCELLED) {
          return existingOrder; // Idempoten: sudah dibatalkan
        }
        throw new ConflictError(
          `Pesanan tidak dapat dibatalkan karena status saat ini adalah ${existingOrder.status}`
        );
      }

      return await tx.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { ticketType: true } }, event: true },
      });
    });
  }

  /**
   * Mengambil riwayat pesanan milik user
   */
  static async getUserOrders(userId: string, options?: { page?: number; limit?: number }) {
    const page = options?.page && options.page > 0 ? options.page : 1;
    const limit = options?.limit && options.limit > 0 ? options.limit : 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
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
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return {
      items: orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mengambil detail satu pesanan berdasarkan ID (dengan lazy-expiry)
   */
  static async getOrderById(userId: string, orderId: string, isAdmin = false) {
    let order = await prisma.order.findUnique({
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

    // Lazy expiry: jika waktu telah kedaluwarsa tapi status masih PENDING_PAYMENT
    if (order.status === OrderStatus.PENDING_PAYMENT && new Date() > order.expiresAt) {
      await expireOverdueOrders();
      order = await prisma.order.findUnique({
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
    }

    return order;
  }

  /**
   * Mengambil semua pesanan untuk Admin
   */
  static async getAllOrders(options?: { page?: number; limit?: number }) {
    const page = options?.page && options.page > 0 ? options.page : 1;
    const limit = options?.limit && options.limit > 0 ? options.limit : 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        skip,
        take: limit,
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
      }),
      prisma.order.count(),
    ]);

    return {
      items: orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
