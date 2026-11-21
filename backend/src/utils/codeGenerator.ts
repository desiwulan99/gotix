import crypto from 'crypto';

/**
 * Menghasilkan kode tiket acak kriptografis unik:
 * Format: GTX- + 12 karakter hex uppercase (mis. GTX-A7F92B3C18E4)
 */
export const generateUniqueTicketCode = (): string => {
  const randomHex = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `GTX-${randomHex}`;
};
