import { z } from 'zod';

export const payOrderSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID pesanan harus berformat UUID'),
  }),
  body: z.object({
    paymentMethod: z.string().optional(),
  }).optional(),
});

export const paymentWebhookSchema = z.object({
  body: z.object({
    eventId: z.string().min(1, 'Event ID webhook wajib diisi (Idempotency Key)'),
    orderId: z.string().uuid('ID pesanan harus berformat UUID'),
    amount: z.number().positive('Nominal pembayaran harus positif'),
    paymentStatus: z.enum(['SUCCESS', 'FAILED']),
    paymentMethod: z.string().default('PAYMENT_GATEWAY_WEBHOOK'),
  }),
});
