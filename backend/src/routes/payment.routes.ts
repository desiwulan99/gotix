import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { payOrderSchema, paymentWebhookSchema } from '../validators/payment.validator';
import { orderIdParamSchema } from '../validators/order.validator';

const router = Router();

// Endpoint simulasi pembayaran oleh user
router.post('/orders/:id/pay', authenticate, validate(payOrderSchema), PaymentController.payOrder);

// Detail status pembayaran suatu pesanan
router.get('/orders/:id/payment', authenticate, validate(orderIdParamSchema), PaymentController.getOrderPayment);

// Endpoint simulasi webhook gateway pembayaran (Idempotency Key & HMAC)
router.post('/webhooks/payment', validate(paymentWebhookSchema), PaymentController.handleWebhook);

export default router;
