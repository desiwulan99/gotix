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
    eventDate: string;
    imageUrl?: string | null;
    ticketTypes: Array<{
      name: string;
      price: number;
      totalQuota: number;
    }>;
  }) {
    return await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        eventDate: new Date(data.eventDate),
        imageUrl: data.imageUrl,
        ticketTypes: {
          create: data.ticketTypes.map((t) => ({
            name: t.name,
            price: new Prisma.Decimal(t.price),
            totalQuota: t.totalQuota,
            reservedQuota: 0,
            paidQuota: 0,
          })),
        },
      },
      include: {
        ticketTypes: true,
      },
    });
  }

  /**
   * Mengambil semua event yang dipublikasikan dengan kuota yang dihitung secara konsisten
   */
  static async getAllEvents() {
    const events = await prisma.event.findMany({
      orderBy: { eventDate: 'asc' },
      include: {
        ticketTypes: true,
      },
    });

    return events.map((event) => {
      let totalRemainingQuota = 0;

      const enrichedTicketTypes = event.ticketTypes.map((tt) => {
        const remainingQuota = tt.totalQuota - (tt.reservedQuota + tt.paidQuota);
        const safeRemaining = Math.max(0, remainingQuota);
        totalRemainingQuota += safeRemaining;

        return {
          id: tt.id,
          name: tt.name,
          price: Number(tt.price),
          totalQuota: tt.totalQuota,
          reservedQuota: tt.reservedQuota,
          paidQuota: tt.paidQuota,
          remainingQuota: safeRemaining,
          isSoldOut: safeRemaining === 0,
        };
      });

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        eventDate: event.eventDate,
        imageUrl: event.imageUrl,
        status: event.status,
        isSoldOut: totalRemainingQuota === 0,
        ticketTypes: enrichedTicketTypes,
      };
    });
  }

  /**
   * Mengambil detail satu event berdasarkan ID
   */
  static async getEventById(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        ticketTypes: true,
      },
    });

    if (!event) {
      throw new NotFoundError('Event tidak ditemukan');
    }

    let totalRemainingQuota = 0;
    const enrichedTicketTypes = event.ticketTypes.map((tt) => {
      const remainingQuota = tt.totalQuota - (tt.reservedQuota + tt.paidQuota);
      const safeRemaining = Math.max(0, remainingQuota);
      totalRemainingQuota += safeRemaining;

      return {
        id: tt.id,
        name: tt.name,
        price: Number(tt.price),
        totalQuota: tt.totalQuota,
        reservedQuota: tt.reservedQuota,
        paidQuota: tt.paidQuota,
        remainingQuota: safeRemaining,
        isSoldOut: safeRemaining === 0,
      };
    });

    return {
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      eventDate: event.eventDate,
      imageUrl: event.imageUrl,
      status: event.status,
      isSoldOut: totalRemainingQuota === 0,
      ticketTypes: enrichedTicketTypes,
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
      eventDate?: string;
      imageUrl?: string | null;
      status?: EventStatus;
    }
  ) {
    await this.getEventById(id); // Pastikan event ada

    return await prisma.event.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.location && { location: data.location }),
        ...(data.eventDate && { eventDate: new Date(data.eventDate) }),
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
    data: { name: string; price: number; totalQuota: number }
  ) {
    await this.getEventById(eventId);

    return await prisma.ticketType.create({
      data: {
        eventId,
        name: data.name,
        price: new Prisma.Decimal(data.price),
        totalQuota: data.totalQuota,
        reservedQuota: 0,
        paidQuota: 0,
      },
    });
  }
}
