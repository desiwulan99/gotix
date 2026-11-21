import { Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../utils/response';
import { Role } from '@prisma/client';

export class OrderController {
  static async createOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await OrderService.createOrder(req.user!.id, req.body);
      sendSuccess(res, order, 201);
    } catch (error) {
      next(error);
    }
  }

  static async cancelOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = req.user!.role === Role.ADMIN;
      const order = await OrderService.cancelOrder(req.user!.id, req.params.id, isAdmin);
      sendSuccess(res, order, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getUserOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const result = await OrderService.getUserOrders(req.user!.id, { page, limit });
      sendSuccess(res, result.items, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async getAllOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const result = await OrderService.getAllOrders({ page, limit });
      sendSuccess(res, result.items, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  static async getOrderById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = req.user!.role === Role.ADMIN;
      const order = await OrderService.getOrderById(req.user!.id, req.params.id, isAdmin);
      sendSuccess(res, order, 200);
    } catch (error) {
      next(error);
    }
  }
}
