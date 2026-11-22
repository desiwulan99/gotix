import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/event.service';
import { sendSuccess } from '../utils/response';
import { EventStatus } from '@prisma/client';

export class EventController {
  static async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await EventService.createEvent(req.body);
      sendSuccess(res, event, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getAllEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = (req.query.search as string) || undefined;
      const status = (req.query.status as EventStatus) || undefined;

      const result = await EventService.getAllEvents({ page, limit, search, status });
      sendSuccess(res, result.items, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async getEventById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await EventService.getEventById(req.params.id);
      sendSuccess(res, event, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await EventService.updateEvent(req.params.id, req.body);
      sendSuccess(res, event, 200);
    } catch (error) {
      next(error);
    }
  }

  static async addTicketType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticketType = await EventService.addTicketType(req.params.id, req.body);
      sendSuccess(res, ticketType, 201);
    } catch (error) {
      next(error);
    }
  }

  static async deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deleted = await EventService.deleteEvent(req.params.id);
      sendSuccess(res, { message: 'Event berhasil dihapus', event: deleted }, 200);
    } catch (error) {
      next(error);
    }
  }
}
