import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../utils/response';
import { prisma } from '../config/prisma';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { Role } from '@prisma/client';

export class PaymentController {
  static async payOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PaymentService.simulatePayment(
        req.user!.id,
        req.params.id,
        req.body
      );
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getOrderPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { orderId: req.params.id },
        include: { order: true },
      });

      if (!payment) {
        throw new NotFoundError('Data pembayaran tidak ditemukan');
      }

      if (payment.order.userId !== req.user!.id && req.user!.role !== Role.ADMIN) {
        throw new ForbiddenError('Anda tidak memiliki akses ke data pembayaran ini');
      }

      sendSuccess(res, payment, 200);
    } catch (error) {
      next(error);
    }
  }

  static async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawSignature = (req.headers['x-gotix-signature'] as string) || undefined;
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      const result = await PaymentService.handlePaymentWebhook(req.body, rawSignature, rawBody);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}
