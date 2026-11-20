import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    eventId: z.string().uuid('ID event harus berformat UUID'),
    items: z
      .array(
        z.object({
          ticketTypeId: z.string().uuid('ID tipe tiket harus berformat UUID'),
          quantity: z
            .number()
            .int()
            .min(1, 'Minimal pembelian 1 tiket')
            .max(4, 'Maksimal pembelian 4 tiket per tipe'),
        })
      )
      .min(1, 'Pesanan harus berisi minimal 1 item tiket'),
  }),
});

export const orderIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID pesanan harus berformat UUID'),
  }),
});
