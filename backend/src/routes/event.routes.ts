import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { validate } from '../middlewares/validate';
import {
  createEventSchema,
  updateEventSchema,
  createTicketTypeSchema,
} from '../validators/event.validator';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

// Public routes
router.get('/', EventController.getAllEvents);
router.get('/:id', EventController.getEventById);

// Admin-only routes
router.post(
  '/',
  authenticate,
  authorize([Role.ADMIN]),
  validate(createEventSchema),
  EventController.createEvent
);

router.patch(
  '/:id',
  authenticate,
  authorize([Role.ADMIN]),
  validate(updateEventSchema),
  EventController.updateEvent
);

router.post(
  '/:id/ticket-types',
  authenticate,
  authorize([Role.ADMIN]),
  validate(createTicketTypeSchema),
  EventController.addTicketType
);

export default router;
