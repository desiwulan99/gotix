import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createOrderSchema, orderIdParamSchema } from '../validators/order.validator';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// Buyer & Admin
router.post('/', validate(createOrderSchema), OrderController.createOrder);
router.get('/', OrderController.getUserOrders);
router.get('/admin/orders', authorize([Role.ADMIN]), OrderController.getAllOrders);
router.get('/admin/all', authorize([Role.ADMIN]), OrderController.getAllOrders);
router.get('/:id', validate(orderIdParamSchema), OrderController.getOrderById);
router.post('/:id/cancel', validate(orderIdParamSchema), OrderController.cancelOrder);

export default router;
