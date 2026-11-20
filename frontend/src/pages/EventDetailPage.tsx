import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Event } from '../types';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, ShieldAlert, Plus, Minus } from 'lucide-react';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [quantities, setQuantities] = useState<{ [ticketTypeId: string]: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        setEvent(res.data.data);
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal memuat event');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleQuantityChange = (ticketTypeId: string, delta: number, remaining: number) => {
    const current = quantities[ticketTypeId] || 0;
    const nextVal = current + delta;

    if (nextVal < 0) return;
    if (nextVal > remaining) {
      alert(`Sisa kuota hanya ${remaining} tiket`);
      return;
    }

    // Hitung total tiket di seluruh tipe tiket yang dipilih saat ini
    const totalAll = Object.entries(quantities).reduce((sum, [key, val]) => {
      return sum + (key === ticketTypeId ? nextVal : val);
    }, 0);

    if (totalAll > 4) {
      alert('Maksimal pemesanan adalah 4 tiket dalam satu transaksi!');
      return;
    }

    setQuantities({
      ...quantities,
      [ticketTypeId]: nextVal,
    });
  };

  const totalTicketsSelected = Object.values(quantities).reduce((a, b) => a + b, 0);

  const calculateTotalPrice = () => {
    if (!event) return 0;
    return event.ticketTypes.reduce((total, tt) => {
      const qty = quantities[tt.id] || 0;
      return total + qty * tt.price;
    }, 0);
  };

  const handleReserve = async () => {
    if (!user) {
      alert('Silakan login terlebih dahulu untuk memesan tiket');
      navigate('/login');
      return;
    }

    if (totalTicketsSelected === 0) {
      alert('Pilih minimal 1 tiket');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const items = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));

    try {
      const res = await api.post('/orders', {
        eventId: event?.id,
        items,
      });
      const order = res.data.data;
      navigate(`/checkout/${order.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membuat reservasi tiket');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-24 text-silver-mist">Memuat detail event...</div>;
  }

  if (!event) {
    return (
      <div className="text-center py-24">
        <p className="text-red-400">Event tidak ditemukan.</p>
      </div>
    );
  }

  const formattedDate = new Date(event.eventDate).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 min-h-screen">
      {/* Banner */}
      <div className="relative h-72 sm:h-96 w-full rounded-xl overflow-hidden border border-royal-plum/40 bg-charcoal shadow-2xl">
        <img
          src={event.imageUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop'}
          alt={event.title}
          className="w-full h-full object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent"></div>

        <div className="absolute bottom-6 left-6 right-6">
          <span className="px-3 py-1 rounded bg-royal-plum/80 border border-muted-violet text-ivory-white text-xs font-semibold tracking-wider uppercase mb-3 inline-block">
            {event.status}
          </span>
          <h1 className="text-2xl sm:text-4xl font-black font-cinzel text-ivory-white tracking-wide">
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 mt-3 text-xs text-silver-mist">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-muted-violet" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-muted-violet" />
              <span>{event.location}</span>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-6 p-4 rounded bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Konten & Pemilihan Tiket */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-10">
        {/* Deskripsi */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold font-cinzel text-ivory-white border-b border-royal-plum/30 pb-3 mb-4">
            Tentang Pertunjukan
          </h2>
          <p className="text-xs sm:text-sm text-silver-mist/80 leading-relaxed whitespace-pre-line font-light">
            {event.description}
          </p>

          <div className="mt-8 p-4 rounded bg-charcoal/60 border border-royal-plum/30">
            <h4 className="text-xs font-bold text-ivory-white uppercase tracking-wider font-cinzel mb-2">
              Aturan Pemesanan Tiket GOTIX
            </h4>
            <ul className="text-xs text-silver-mist/70 list-disc list-inside space-y-1">
              <li>Maksimal pembelian 4 tiket dalam satu pesanan.</li>
              <li>Satu akun maksimal memiliki 4 tiket untuk event ini (gabungan pesanan aktif & lunas).</li>
              <li>Tiket akan ditahan (*held*) selama 15 menit setelah tombol reservasi ditekan.</li>
              <li>Jika tidak dibayar dalam 15 menit, kuota otomatis kembali ke sistem.</li>
            </ul>
          </div>
        </div>

        {/* Pilihan Tiket & Checkout Card */}
        <div className="lg:col-span-1">
          <div className="bg-charcoal border border-royal-plum/60 rounded-xl p-6 shadow-xl sticky top-24">
            <h3 className="text-base font-bold font-cinzel text-ivory-white mb-4 border-b border-royal-plum/30 pb-3">
              Pilih Tipe Tiket
            </h3>

            <div className="space-y-4 mb-6">
              {event.ticketTypes.map((tt) => (
                <div
                  key={tt.id}
                  className={`p-4 rounded-lg border transition-all ${
                    tt.isSoldOut
                      ? 'bg-obsidian/40 border-gray-800 opacity-60'
                      : 'bg-obsidian/70 border-royal-plum/40 hover:border-muted-violet/60'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-ivory-white font-cinzel">{tt.name}</h4>
                      <p className="text-xs font-semibold text-muted-violet mt-0.5">
                        Rp {tt.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        tt.isSoldOut
                          ? 'bg-red-950 text-red-400'
                          : 'bg-royal-plum/40 text-silver-mist'
                      }`}
                    >
                      {tt.isSoldOut ? 'Habis' : `Sisa ${tt.remainingQuota}`}
                    </span>
                  </div>

                  {!tt.isSoldOut && (
                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-royal-plum/20">
                      <span className="text-xs text-silver-mist/60">Jumlah</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleQuantityChange(tt.id, -1, tt.remainingQuota)}
                          disabled={!quantities[tt.id]}
                          className="w-7 h-7 rounded bg-royal-plum/30 hover:bg-royal-plum/60 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-ivory-white text-xs transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-bold w-4 text-center text-ivory-white">
                          {quantities[tt.id] || 0}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(tt.id, 1, tt.remainingQuota)}
                          disabled={totalTicketsSelected >= 4 || (quantities[tt.id] || 0) >= tt.remainingQuota}
                          className="w-7 h-7 rounded bg-royal-plum/30 hover:bg-royal-plum/60 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-ivory-white text-xs transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Total Ringkasan */}
            <div className="border-t border-royal-plum/40 pt-4 mb-6">
              <div className="flex justify-between text-xs text-silver-mist mb-1">
                <span>Total Tiket Dipilih:</span>
                <span className="font-bold text-ivory-white">{totalTicketsSelected} dari maks 4</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-ivory-white font-cinzel">
                <span>Total Harga:</span>
                <span className="text-base text-silver-mist">
                  Rp {calculateTotalPrice().toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <button
              onClick={handleReserve}
              disabled={isSubmitting || totalTicketsSelected === 0}
              className="w-full py-3.5 rounded bg-royal-plum hover:bg-royal-plum/80 disabled:opacity-40 disabled:cursor-not-allowed text-ivory-white text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-royal-plum/20"
            >
              {isSubmitting ? 'Memproses Reservasi...' : 'Pesan Tiket Sekarang'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
