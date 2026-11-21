import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { sendSuccess } from '../utils/response';
import { NotFoundError } from '../utils/errors';
import { AuthRequest } from '../utils/response';
import { Role } from '@prisma/client';

export class TicketController {
  static async getUserTickets(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tickets = await prisma.ticket.findMany({
        where: { userId: req.user!.id },
        orderBy: { issuedAt: 'desc' },
        include: {
          ticketType: true,
          order: {
            include: {
              event: true,
            },
          },
        },
      });

      sendSuccess(res, tickets, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getTicketById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: req.params.id },
        include: {
          ticketType: true,
          order: {
            include: {
              event: true,
            },
          },
        },
      });

      if (!ticket) {
        throw new NotFoundError('Tiket tidak ditemukan');
      }

      if (ticket.userId !== req.user!.id && req.user!.role !== Role.ADMIN) {
        throw new NotFoundError('Tiket tidak ditemukan');
      }

      sendSuccess(res, ticket, 200);
    } catch (error) {
      next(error);
    }
  }
}
