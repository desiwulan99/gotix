import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/event.service';
import { sendSuccess } from '../utils/response';

export class EventController {
  static async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await EventService.createEvent(req.body);
      sendSuccess(res, 'Event berhasil dibuat', event, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getAllEvents(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const events = await EventService.getAllEvents();
      sendSuccess(res, 'Daftar event berhasil diambil', events, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getEventById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await EventService.getEventById(req.params.id);
      sendSuccess(res, 'Detail event berhasil diambil', event, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const event = await EventService.updateEvent(req.params.id, req.body);
      sendSuccess(res, 'Event berhasil diperbarui', event, 200);
    } catch (error) {
      next(error);
    }
  }

  static async addTicketType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticketType = await EventService.addTicketType(req.params.id, req.body);
      sendSuccess(res, 'Tipe tiket berhasil ditambahkan', ticketType, 201);
    } catch (error) {
      next(error);
    }
  }
}
