/**
 * Pure functions untuk logika bisnis pemilihan tiket di Frontend.
 * Menjamin UI mencerminkan batas ketat backend secara deterministik:
 * 1. Batas maksimal 4 tiket aktif per event per user (gabungan PENDING_PAYMENT + PAID).
 * 2. Stepper tidak pernah melebihi sisa kuota (remaining).
 * 3. Stepper tidak pernah membuat total lintas semua tipe melebihi 4.
 * 4. Format mata uang Rupiah standar Indonesia (id-ID).
 */

export interface SelectedTicketItem {
  ticketTypeId: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Menghitung jumlah maksimal tiket yang dapat dipilih untuk suatu tipe tiket tertentu.
 *
 * @param remaining Sisa kuota tipe tiket tersebut dari API server (quota - reservedCount)
 * @param selectedInOtherTypes Jumlah tiket yang sedang dipilih pada tipe-tipe tiket lainnya
 * @param alreadyOwnedActive Jumlah tiket aktif (PENDING_PAYMENT + PAID) yang sudah dimiliki pembeli di event ini
 */
export function maxSelectable(
  remaining: number,
  selectedInOtherTypes = 0,
  alreadyOwnedActive = 0
): number {
  const safeRemaining = Math.max(0, remaining);
  const remainingAllowanceForUser = Math.max(0, 4 - selectedInOtherTypes - alreadyOwnedActive);
  return Math.min(safeRemaining, remainingAllowanceForUser);
}

/**
 * Menghitung total harga dari item-item tiket yang dipilih.
 */
export function calcTotal(items: Array<{ quantity: number; unitPrice: number }>): number {
  return items.reduce((sum, item) => sum + (item.quantity > 0 ? item.quantity * item.unitPrice : 0), 0);
}

/**
 * Menghitung total kuantitas dari item-item tiket yang dipilih.
 */
export function calcTotalQuantity(items: Array<{ quantity: number }>): number {
  return items.reduce((sum, item) => sum + (item.quantity > 0 ? item.quantity : 0), 0);
}

/**
 * Memformat angka ke format Rupiah standar Indonesia.
 * Contoh: 250000 -> "Rp 250.000"
 */
export function formatRupiah(amount: number): string {
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  // Mengubah "IDR 250.000" atau "Rp250.000" menjadi standar "Rp 250.000"
  return formatted.replace(/IDR\s?/, 'Rp ').replace(/Rp(?!\s)/, 'Rp ');
}
