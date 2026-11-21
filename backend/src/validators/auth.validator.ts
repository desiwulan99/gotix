import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    fullName: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
    role: z.enum(['BUYER', 'ADMIN', 'CUSTOMER']).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(1, 'Password wajib diisi'),
  }),
});
