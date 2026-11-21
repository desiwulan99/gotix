import { z } from 'zod';

export const payOrderSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID pesanan harus berformat UUID'),
  }),
  body: z
    .object({
      paymentMethod: z.string().optional(),
    })
    .optional(),
});

export const paymentWebhookSchema = z.object({
  body: z.object({
    eventId: z.string().min(1, 'Event ID webhook wajib diisi (Idempotency Key)'),
    type: z.string().optional().default('payment.succeeded'),
    orderId: z.string().uuid('ID pesanan harus berformat UUID'),
    amount: z.number().positive('Nominal pembayaran harus positif').optional(),
    paymentStatus: z.enum(['SUCCESS', 'FAILED']).optional(),
    paymentMethod: z.string().optional().default('GATEWAY_WEBHOOK'),
  }),
});
