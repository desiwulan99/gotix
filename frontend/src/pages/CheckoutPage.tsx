import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Order } from '../types';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatRupiah } from '../lib/ticketRules';

export const CheckoutPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      const orderData: Order = res.data.data;
      setOrder(orderData);

      // Hitung selisih detik dari expiresAt server terhadap waktu saat ini
      const diff = Math.max(
        0,
        Math.floor((new Date(orderData.expiresAt).getTime() - Date.now()) / 1000)
      );
      setTimeLeft(diff);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengambil data pesanan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  // Countdown timer presisi
  useEffect(() => {
    if (timeLeft <= 0) {
      if (order?.status === 'PENDING_PAYMENT') {
        // Ambil ulang status jika timer habis untuk sinkronisasi lazy-expiry backend
        fetchOrder();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          fetchOrder();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handlePay = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await api.post(`/orders/${id}/pay`, {
        paymentMethod: 'SIMULATED_INSTANT_TRANSFER',
      });
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/tiket-saya');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Pembayaran gagal diproses');
      // Refresh order jika gagal (misal expired)
      fetchOrder();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan pesanan ini? Kuota tiket akan segera dikembalikan.')) {
      return;
    }
    setIsProcessing(true);
    try {
      await api.post(`/orders/${id}/cancel`);
      navigate('/events');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membatalkan pesanan');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <div className="text-dusk-rose text-2xl select-none mb-3 animate-pulse">✦</div>
        <p className="font-cinzel text-xs tracking-[0.2em] uppercase text-silver-mist">
          Memuat ringkasan pesanan...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <h2 className="font-cinzel text-xl text-ivory mb-4">Pesanan Tidak Ditemukan</h2>
        <Link to="/events" className="font-cinzel text-xs tracking-[0.2em] text-dusk-rose underline">
          KEMBALI KE EVENTS
        </Link>
      </div>
    );
  }

  const isExpired = order.status === 'EXPIRED' || (order.status === 'PENDING_PAYMENT' && timeLeft <= 0);
  const isPaid = order.status === 'PAID';
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 min-h-screen bg-obsidian text-ivory">
      {/* Header Checkout */}
      <div className="border-b border-silver-mist/15 pb-6 mb-8 text-left">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-dusk-rose font-cinzel">
              ✦ RESERVASI & PEMBAYARAN ✦
            </span>
            <h1 className="text-2xl sm:text-3xl font-normal font-cinzel text-ivory tracking-[0.05em] mt-1">
              CHECKOUT PESANAN
            </h1>
          </div>
          <StatusBadge status={isExpired ? 'EXPIRED' : order.status} />
        </div>
      </div>

      {/* Banner Countdown Timer (Hanya jika PENDING_PAYMENT dan belum kedaluwarsa) */}
      {!isPaid && !isCancelled && !isExpired && (
        <div className="p-5 bg-charcoal border border-dusk-rose/40 mb-8 flex items-center justify-between">
          <div>
            <span className="block text-[11px] font-cinzel uppercase tracking-[0.2em] text-silver-mist/70">
              Sisa Waktu Penahanan Kuota
            </span>
            <span className="text-xs font-inter text-silver-mist/60">
              Selesaikan pembayaran sebelum batas waktu habis
            </span>
          </div>
          <div className="font-inter font-bold text-2xl sm:text-3xl text-dusk-rose tracking-wider">
            {formatCountdown(timeLeft)}
          </div>
        </div>
      )}

      {/* Alert Status Sukses / Expired / Cancelled */}
      {isSuccess && (
        <div className="p-4 bg-charcoal border border-emerald-500/60 text-emerald-300 text-xs font-inter mb-6">
          Pembayaran berhasil! Mengarahkan ke halaman Tiket Saya...
        </div>
      )}

      {isExpired && (
        <div className="p-4 bg-charcoal border border-red-500/50 text-red-300 text-xs font-inter mb-6">
          Pesanan ini telah kedaluwarsa. Kuota tiket telah dipulihkan ke sistem secara otomatis.
        </div>
      )}

      {isCancelled && (
        <div className="p-4 bg-charcoal border border-zinc-600 text-zinc-400 text-xs font-inter mb-6">
          Pesanan ini telah dibatalkan. Kuota tiket telah dikembalikan.
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-charcoal border border-red-500/60 text-red-300 text-xs font-inter mb-6">
          {errorMsg}
        </div>
      )}

      {/* Rincian Pesanan */}
      <div className="bg-charcoal border border-silver-mist/20 p-6 space-y-6 text-left mb-8">
        <div>
          <span className="block text-[10px] uppercase font-cinzel text-silver-mist/60 tracking-wider">
            Event
          </span>
          <h3 className="font-cinzel text-lg text-ivory tracking-wide mt-0.5">
            {order.event?.title}
          </h3>
          <p className="text-xs text-silver-mist/70 font-inter mt-1">
            {order.event?.location}
          </p>
        </div>

        <div className="h-[1px] w-full bg-silver-mist/10" />

        {/* Item Tiket yang Dipesan */}
        <div>
          <span className="block text-[10px] uppercase font-cinzel text-silver-mist/60 tracking-wider mb-3">
            Item Tiket
          </span>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs font-inter">
                <div>
                  <span className="font-medium text-ivory">
                    {item.ticketType?.name || 'Tiket'}
                  </span>
                  <span className="text-silver-mist/60 ml-2">x {item.quantity}</span>
                </div>
                <span className="text-ivory font-semibold">
                  {formatRupiah(Number(item.unitPrice) * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-[1px] w-full bg-silver-mist/10" />

        {/* Total Pembayaran */}
        <div className="flex items-center justify-between pt-2">
          <span className="font-cinzel text-sm uppercase tracking-wider text-ivory">
            Total Pembayaran
          </span>
          <span className="font-inter font-bold text-2xl text-dusk-rose">
            {formatRupiah(Number(order.totalAmount))}
          </span>
        </div>
      </div>

      {/* Tombol Aksi */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
        {!isPaid && !isCancelled && !isExpired && (
          <>
            <Button
              variant="danger"
              size="md"
              onClick={handleCancel}
              disabled={isProcessing}
              className="w-full sm:w-auto"
            >
              Batalkan Pesanan
            </Button>

            <Button
              variant="primary"
              size="lg"
              onClick={handlePay}
              isLoading={isProcessing}
              disabled={isProcessing}
              className="w-full sm:w-auto px-8"
            >
              Bayar Sekarang (Simulasi)
            </Button>
          </>
        )}

        {(isPaid || isExpired || isCancelled) && (
          <Link to="/events" className="w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full">
              Kembali ke Katalog Event
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};
