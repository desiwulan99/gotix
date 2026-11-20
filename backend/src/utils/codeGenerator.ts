import crypto from 'crypto';

/**
 * Menghasilkan kode tiket unik yang aman dan tidak dapat ditebak.
 * Format: GTX-<4_CHAR_HEX>-<4_CHAR_HEX> (Contoh: GTX-A8F2-3C91)
 */
export const generateUniqueTicketCode = (): string => {
  const segment1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const segment2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `GTX-${segment1}-${segment2}`;
};
