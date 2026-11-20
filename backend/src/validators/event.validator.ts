import { z } from 'zod';

export const createEventSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Judul event minimal 3 karakter'),
    description: z.string().min(10, 'Deskripsi event minimal 10 karakter'),
    location: z.string().min(3, 'Lokasi event minimal 3 karakter'),
    eventDate: z.string().datetime({ message: 'Format tanggal event harus ISO 8601' }),
    imageUrl: z.string().url('URL gambar tidak valid').optional().nullable(),
    ticketTypes: z.array(
      z.object({
        name: z.string().min(2, 'Nama tipe tiket minimal 2 karakter'),
        price: z.number().positive('Harga tiket harus lebih besar dari 0'),
        totalQuota: z.number().int().positive('Total kuota tiket harus lebih besar dari 0'),
      })
    ).min(2, 'Event wajib memiliki minimal 2 tipe tiket (Regular dan VIP)'),
  }),
});

export const updateEventSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID event harus berformat UUID'),
  }),
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    location: z.string().min(3).optional(),
    eventDate: z.string().datetime().optional(),
    imageUrl: z.string().url().optional().nullable(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED']).optional(),
  }),
});

export const createTicketTypeSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID event harus berformat UUID'),
  }),
  body: z.object({
    name: z.string().min(2, 'Nama tipe tiket minimal 2 karakter'),
    price: z.number().positive('Harga tiket harus lebih besar dari 0'),
    totalQuota: z.number().int().positive('Total kuota tiket harus lebih besar dari 0'),
  }),
});
