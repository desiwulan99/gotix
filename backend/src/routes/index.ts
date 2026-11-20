import { Router } from 'express';
import authRoutes from './auth.routes';
import eventRoutes from './event.routes';
import orderRoutes from './order.routes';
import paymentRoutes from './payment.routes';
import ticketRoutes from './ticket.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/orders', orderRoutes);
router.use('/', paymentRoutes); // Menangani /orders/:id/pay dan /webhooks/payment
router.use('/tickets', ticketRoutes);

export default router;
