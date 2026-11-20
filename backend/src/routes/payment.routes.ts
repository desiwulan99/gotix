import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { payOrderSchema, paymentWebhookSchema } from '../validators/payment.validator';

const router = Router();

// Endpoint simulasi pembayaran oleh user
router.post('/orders/:id/pay', authenticate, validate(payOrderSchema), PaymentController.payOrder);

// Endpoint simulasi webhook gateway pembayaran (Idempotency Key)
router.post('/webhooks/payment', validate(paymentWebhookSchema), PaymentController.handleWebhook);

export default router;
