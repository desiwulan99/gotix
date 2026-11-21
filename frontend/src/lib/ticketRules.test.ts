import { describe, it, expect } from 'vitest';
import { maxSelectable, calcTotal, calcTotalQuantity, formatRupiah } from './ticketRules';

describe('Frontend Ticket Rules Unit Tests', () => {
  describe('maxSelectable', () => {
    it('membatasi maksimal 4 jika kuota melimpah dan belum ada tiket lain', () => {
      expect(maxSelectable(100, 0, 0)).toBe(4);
    });

    it('membatasi sesuai sisa kuota jika kuota lebih kecil dari 4', () => {
      expect(maxSelectable(2, 0, 0)).toBe(2);
      expect(maxSelectable(0, 0, 0)).toBe(0);
      expect(maxSelectable(-5, 0, 0)).toBe(0);
    });

    it('mengurangi batas jika sudah ada tiket yang dipilih di tipe lain', () => {
      // Pembeli memilih 2 tiket Regular, maka VIP maksimal hanya boleh 2
      expect(maxSelectable(50, 2, 0)).toBe(2);
      // Pembeli memilih 3 tiket Regular, maka VIP maksimal hanya boleh 1
      expect(maxSelectable(50, 3, 0)).toBe(1);
      // Pembeli memilih 4 tiket Regular, maka VIP maksimal 0
      expect(maxSelectable(50, 4, 0)).toBe(0);
    });

    it('mengurangi batas jika user sudah memiliki tiket aktif sebelumnya', () => {
      // User sudah punya 2 tiket aktif, belum pilih tipe lain
      expect(maxSelectable(50, 0, 2)).toBe(2);
      // User sudah punya 3 tiket aktif, belum pilih tipe lain
      expect(maxSelectable(50, 0, 3)).toBe(1);
      // User sudah punya 4 tiket aktif, tidak bisa beli lagi
      expect(maxSelectable(50, 0, 4)).toBe(0);
      // User sudah punya 2 tiket aktif, dan sedang memilih 1 tiket di tipe lain
      expect(maxSelectable(50, 1, 2)).toBe(1);
    });
  });

  describe('calcTotal', () => {
    it('menghitung total harga dengan benar', () => {
      const items = [
        { quantity: 2, unitPrice: 250000 },
        { quantity: 1, unitPrice: 750000 },
      ];
      expect(calcTotal(items)).toBe(1250000);
    });

    it('mengembalikan 0 untuk daftar kosong', () => {
      expect(calcTotal([])).toBe(0);
    });
  });

  describe('calcTotalQuantity', () => {
    it('menghitung total tiket yang dipilih', () => {
      expect(calcTotalQuantity([{ quantity: 2 }, { quantity: 1 }])).toBe(3);
    });
  });

  describe('formatRupiah', () => {
    it('memformat nominal ke format Rupiah dengan benar', () => {
      expect(formatRupiah(250000)).toMatch(/Rp\s250\.000/);
      expect(formatRupiah(1550000)).toMatch(/Rp\s1\.550\.000/);
      expect(formatRupiah(0)).toMatch(/Rp\s0/);
    });
  });
});
