import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export class PaymentController {
  static async payOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PaymentService.simulatePayment(
        req.user!.id,
        req.params.id,
        req.body
      );
      sendSuccess(res, 'Pembayaran berhasil dikonfirmasi dan tiket telah terbit', result, 200);
    } catch (error) {
      next(error);
    }
  }

  static async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PaymentService.handlePaymentWebhook(req.body);
      sendSuccess(res, result.message, result, 200);
    } catch (error) {
      next(error);
    }
  }
}
