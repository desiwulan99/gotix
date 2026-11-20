import { Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';
import { Role } from '@prisma/client';

export class OrderController {
  static async createOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await OrderService.createOrder(req.user!.id, req.body);
      sendSuccess(res, 'Pesanan berhasil dibuat. Silakan bayar dalam 15 menit', order, 201);
    } catch (error) {
      next(error);
    }
  }

  static async cancelOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = req.user!.role === Role.ADMIN;
      const order = await OrderService.cancelOrder(req.user!.id, req.params.id, isAdmin);
      sendSuccess(res, 'Pesanan berhasil dibatalkan dan kuota dikembalikan', order, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getUserOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await OrderService.getUserOrders(req.user!.id);
      sendSuccess(res, 'Daftar riwayat pesanan berhasil diambil', orders, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getAllOrders(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await OrderService.getAllOrders();
      sendSuccess(res, 'Seluruh pesanan berhasil diambil (Admin)', orders, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getOrderById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = req.user!.role === Role.ADMIN;
      const order = await OrderService.getOrderById(req.user!.id, req.params.id, isAdmin);
      sendSuccess(res, 'Detail pesanan berhasil diambil', order, 200);
    } catch (error) {
      next(error);
    }
  }
}
