import { EventStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { NotFoundError } from '../utils/errors';

export class EventService {
  /**
   * Membuat event baru beserta tipe tiketnya (Minimal Regular dan VIP)
   */
  static async createEvent(data: {
    title: string;
    description: string;
    location: string;
    startsAt?: string;
    eventDate?: string;
    imageUrl?: string | null;
    ticketTypes: Array<{
      name: string;
      price: number;
      quota: number;
    }>;
  }) {
    const eventTime = new Date(data.startsAt || data.eventDate || Date.now());

    return await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        startsAt: eventTime,
        imageUrl: data.imageUrl,
        ticketTypes: {
          create: data.ticketTypes.map((t) => ({
            name: t.name,
            price: new Prisma.Decimal(t.price),
            quota: t.quota,
            reservedCount: 0,
          })),
        },
      },
      include: {
        ticketTypes: true,
      },
    });
  }

  /**
   * Mengambil semua event dengan kuota akurat, sisa kuota, dan flag soldOut
   */
  static async getAllEvents(options?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: EventStatus;
  }) {
    const page = options?.page && options.page > 0 ? options.page : 1;
    const limit = options?.limit && options.limit > 0 ? options.limit : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {
      ...(options?.status && { status: options.status }),
      ...(options?.search && {
        OR: [
          { title: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
          { location: { contains: options.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startsAt: 'asc' },
        include: {
          ticketTypes: {
            orderBy: { price: 'asc' },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    const enrichedEvents = events.map((event) => {
      let totalRemainingQuota = 0;

      const ticketTypes = event.ticketTypes.map((tt) => {
        const remaining = Math.max(0, tt.quota - tt.reservedCount);
        totalRemainingQuota += remaining;

        return {
          id: tt.id,
          name: tt.name,
          price: Number(tt.price),
          quota: tt.quota,
          reservedCount: tt.reservedCount,
          remaining,
          soldOut: remaining === 0,
          // backwards-compatibility:
          totalQuota: tt.quota,
          remainingQuota: remaining,
          isSoldOut: remaining === 0,
        };
      });

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        startsAt: event.startsAt,
        eventDate: event.startsAt, // alias
        imageUrl: event.imageUrl,
        status: event.status,
        soldOut: totalRemainingQuota === 0,
        isSoldOut: totalRemainingQuota === 0,
        ticketTypes,
      };
    });

    return {
      items: enrichedEvents,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mengambil detail satu event berdasarkan ID
   */
  static async getEventById(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        ticketTypes: {
          orderBy: { price: 'asc' },
        },
      },
    });

    if (!event) {
      throw new NotFoundError('Event tidak ditemukan');
    }

    let totalRemainingQuota = 0;
    const ticketTypes = event.ticketTypes.map((tt) => {
      const remaining = Math.max(0, tt.quota - tt.reservedCount);
      totalRemainingQuota += remaining;

      return {
        id: tt.id,
        name: tt.name,
        price: Number(tt.price),
        quota: tt.quota,
        reservedCount: tt.reservedCount,
        remaining,
        soldOut: remaining === 0,
        // compatibility aliases
        totalQuota: tt.quota,
        remainingQuota: remaining,
        isSoldOut: remaining === 0,
      };
    });

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      startsAt: event.startsAt,
      eventDate: event.startsAt,
      imageUrl: event.imageUrl,
      status: event.status,
      soldOut: totalRemainingQuota === 0,
      isSoldOut: totalRemainingQuota === 0,
      ticketTypes,
    };
  }

  /**
   * Update informasi event
   */
  static async updateEvent(
    id: string,
    data: {
      title?: string;
      description?: string;
      location?: string;
      startsAt?: string;
      eventDate?: string;
      imageUrl?: string | null;
      status?: EventStatus;
    }
  ) {
    await this.getEventById(id);

    const eventDate = data.startsAt || data.eventDate;

    return await prisma.event.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.location && { location: data.location }),
        ...(eventDate && { startsAt: new Date(eventDate) }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.status && { status: data.status }),
      },
      include: {
        ticketTypes: true,
      },
    });
  }

  /**
   * Tambah tipe tiket baru ke event
   */
  static async addTicketType(
    eventId: string,
    data: { name: string; price: number; quota: number }
  ) {
    await this.getEventById(eventId);

    return await prisma.ticketType.create({
      data: {
        eventId,
        name: data.name,
        price: new Prisma.Decimal(data.price),
        quota: data.quota,
        reservedCount: 0,
      },
    });
  }

  /**
   * Menghapus event beserta seluruh data terkait (tiket, pembayaran, pesanan, tipe tiket)
   */
  static async deleteEvent(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundError('Event tidak ditemukan');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Hapus tiket yang terkait dengan pesanan pada event ini
      await tx.ticket.deleteMany({
        where: {
          order: {
            eventId: id,
          },
        },
      });

      // 2. Hapus catatan pembayaran yang terkait
      await tx.payment.deleteMany({
        where: {
          order: {
            eventId: id,
          },
        },
      });

      // 3. Hapus order items
      await tx.orderItem.deleteMany({
        where: {
          order: {
            eventId: id,
          },
        },
      });

      // 4. Hapus pesanan (orders)
      await tx.order.deleteMany({
        where: {
          eventId: id,
        },
      });

      // 5. Hapus tipe tiket
      await tx.ticketType.deleteMany({
        where: {
          eventId: id,
        },
      });

      // 6. Hapus event utama
      return await tx.event.delete({
        where: { id },
      });
    });
  }
}
