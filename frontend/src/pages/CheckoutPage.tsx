import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Order } from '../types';
import { Clock, ShieldCheck, AlertCircle, XCircle } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        const orderData: Order = res.data.data;
        setOrder(orderData);

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

    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
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
        navigate('/my-tickets');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Pembayaran gagal diproses');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (
      !window.confirm(
        'Apakah Anda yakin ingin membatalkan pesanan ini? Kuota tiket akan segera dikembalikan.'
      )
    ) {
      return;
    }
    setIsProcessing(true);
    try {
      await api.post(`/orders/${id}/cancel`);
      alert('Pesanan berhasil dibatalkan');
      navigate('/events');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membatalkan pesanan');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-24 text-secondary text-xs">Memuat pesanan...</div>;
  }

  if (!order) {
    return (
      <div className="text-center py-24">
        <p className="text-red-500 text-xs">Pesanan tidak ditemukan.</p>
      </div>
    );
  }

  const isExpired =
    order.status === 'EXPIRED' || (order.status === 'PENDING_PAYMENT' && timeLeft <= 0);

  return (
    <div className="max-w-3xl mx-auto py-12 px-6 min-h-screen bg-ivory text-charcoal">
      <div className="bg-white border border-soft-gray rounded-3xl p-6 sm:p-10 shadow-soft-card">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-soft-gray gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-secondary font-semibold">
              Checkout Pemesanan
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-cinzel text-charcoal mt-0.5">
              {order.event?.title}
            </h1>
          </div>

          {/* Countdown Display */}
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-pearl border border-soft-gray shadow-xs">
            <Clock
              className={`w-4 h-4 ${
                isExpired ? 'text-red-500' : 'text-royal-mauve animate-pulse'
              }`}
            />
            <div>
              <div className="text-[10px] uppercase text-secondary font-semibold">
                Sisa Waktu Bayar
              </div>
              <div
                className={`text-sm font-black font-mono tracking-wider ${
                  isExpired ? 'text-red-600' : 'text-charcoal'
                }`}
              >
                {isExpired ? 'KEDALUWARSA' : formatCountdown(timeLeft)}
              </div>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="my-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isSuccess && (
          <div className="my-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>Pembayaran Berhasil! Tiket resmi sedang diterbitkan dan Anda akan dialihkan...</span>
          </div>
        )}

        {/* Rincian Pesanan */}
        <div className="py-6 border-b border-soft-gray">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-charcoal mb-4 font-cinzel">
            Rincian Item Tiket
          </h3>

          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-charcoal">{item.ticketType?.name}</span>
                  <span className="text-secondary ml-2 font-light">x {item.quantity}</span>
                </div>
                <span className="font-medium text-charcoal">
                  Rp {(item.quantity * Number(item.unitPrice)).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Total Bayar */}
        <div className="py-6 border-b border-soft-gray flex justify-between items-center">
          <span className="text-sm font-semibold text-charcoal font-cinzel">Total Pembayaran</span>
          <span className="text-xl font-bold font-cinzel text-plum">
            Rp {Number(order.totalAmount).toLocaleString('id-ID')}
          </span>
        </div>

        {/* Tombol Aksi */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handlePay}
            disabled={
              isProcessing || isExpired || isSuccess || order.status !== 'PENDING_PAYMENT'
            }
            className="w-full sm:flex-1 py-3.5 rounded-xl bg-royal-mauve hover:bg-plum disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-sm hover:shadow"
          >
            {isProcessing ? 'Memproses...' : 'Bayar Sekarang (Simulasi)'}
          </button>

          <button
            onClick={handleCancel}
            disabled={isProcessing || isSuccess || order.status !== 'PENDING_PAYMENT'}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-red-50 border border-soft-gray hover:border-red-300 text-muted-charcoal hover:text-red-600 text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            <span>Batalkan Pesanan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
