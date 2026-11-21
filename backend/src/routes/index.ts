import { Router } from 'express';
import authRoutes from './auth.routes';
import eventRoutes from './event.routes';
import orderRoutes from './order.routes';
import paymentRoutes from './payment.routes';
import ticketRoutes from './ticket.routes';
import { authenticate, authorize } from '../middlewares/auth';
import { OrderController } from '../controllers/order.controller';
import { Role } from '@prisma/client';

const router = Router();

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/orders', orderRoutes);
router.use('/admin/orders', authenticate, authorize([Role.ADMIN]), OrderController.getAllOrders);
router.use('/', paymentRoutes); // /orders/:id/pay, /orders/:id/payment, /webhooks/payment
router.use('/tickets', ticketRoutes);

export default router;
