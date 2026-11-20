import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Event } from '../types';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, ShieldAlert, Plus, Minus, ArrowLeft, Shield, Sparkles } from 'lucide-react';

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
    return <div className="text-center py-24 text-secondary text-xs">Memuat detail event...</div>;
  }

  if (!event) {
    return (
      <div className="text-center py-24">
        <p className="text-red-500 text-xs">Event tidak ditemukan.</p>
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
    <div className="max-w-6xl mx-auto py-10 px-6 min-h-screen bg-ivory text-charcoal">
      {/* Back Link */}
      <Link
        to="/events"
        className="inline-flex items-center gap-1.5 text-xs text-muted-charcoal hover:text-plum font-medium mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Katalog Event</span>
      </Link>

      {/* Banner Card */}
      <div className="relative h-72 sm:h-96 w-full rounded-3xl overflow-hidden border border-soft-gray bg-white shadow-soft-card">
        <img
          src={
            event.imageUrl ||
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop'
          }
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent"></div>

        <div className="absolute bottom-6 left-6 right-6">
          <span className="px-3 py-1 rounded-full bg-white/90 text-plum text-[10px] font-bold tracking-wider uppercase mb-3 inline-block backdrop-blur-sm border border-dusty-purple/30 shadow-sm">
            {event.status}
          </span>
          <h1 className="text-2xl sm:text-4xl font-black font-cinzel text-white tracking-wide">
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 mt-3 text-xs text-silver-mist">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-dusty-purple" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-dusty-purple" />
              <span>{event.location}</span>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Konten & Pemilihan Tiket */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-10">
        {/* Deskripsi */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold font-cinzel text-charcoal border-b border-soft-gray pb-3 mb-4">
            Tentang Pertunjukan
          </h2>
          <p className="text-xs sm:text-sm text-muted-charcoal leading-relaxed whitespace-pre-line font-light">
            {event.description}
          </p>

          <div className="mt-8 p-6 rounded-2xl bg-white border border-soft-gray shadow-soft-card">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-royal-mauve" />
              <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider font-cinzel">
                Aturan Pemesanan Tiket GOTIX
              </h4>
            </div>
            <ul className="text-xs text-muted-charcoal/80 space-y-2 font-light list-disc list-inside">
              <li>Maksimal pembelian 4 tiket dalam satu pesanan.</li>
              <li>Satu akun maksimal memiliki 4 tiket untuk event ini (gabungan pesanan aktif & lunas).</li>
              <li>Tiket akan ditahan (*held*) selama 15 menit setelah tombol reservasi ditekan.</li>
              <li>Jika tidak dibayar dalam 15 menit, kuota otomatis kembali ke sistem secara idempoten.</li>
            </ul>
          </div>
        </div>

        {/* Pilihan Tiket & Checkout Card */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-soft-gray rounded-3xl p-6 shadow-soft-card sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-soft-gray mb-5">
              <h3 className="text-sm font-bold font-cinzel text-charcoal">
                Pilih Tipe Tiket
              </h3>
              <Sparkles className="w-4 h-4 text-royal-mauve" />
            </div>

            <div className="space-y-4 mb-6">
              {event.ticketTypes.map((tt) => {
                const isVIP = tt.name.toUpperCase().includes('VIP');
                return (
                  <div
                    key={tt.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      tt.isSoldOut
                        ? 'bg-pearl/50 border-soft-gray opacity-60'
                        : isVIP
                        ? 'bg-soft-lavender/30 border-dusty-purple/60 hover:border-royal-mauve'
                        : 'bg-pearl/30 border-soft-gray hover:border-dusty-purple/60'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-charcoal font-cinzel flex items-center gap-2">
                          <span>{tt.name}</span>
                          {isVIP && (
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-dusty-purple/40 text-plum">
                              VIP
                            </span>
                          )}
                        </h4>
                        <p className="text-xs font-semibold text-plum mt-1">
                          Rp {tt.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                          tt.isSoldOut
                            ? 'bg-red-50 text-red-600 border border-red-200'
                            : 'bg-white text-muted-charcoal border border-soft-gray shadow-xs'
                        }`}
                      >
                        {tt.isSoldOut ? 'Habis' : `Sisa ${tt.remainingQuota}`}
                      </span>
                    </div>

                    {!tt.isSoldOut && (
                      <div className="mt-4 flex items-center justify-between pt-3 border-t border-soft-gray/50">
                        <span className="text-xs text-secondary font-medium">Jumlah</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleQuantityChange(tt.id, -1, tt.remainingQuota)}
                            disabled={!quantities[tt.id]}
                            className="w-7 h-7 rounded-lg bg-white border border-soft-gray hover:border-dusty-purple disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-charcoal text-xs shadow-xs transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center text-charcoal">
                            {quantities[tt.id] || 0}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(tt.id, 1, tt.remainingQuota)}
                            disabled={
                              totalTicketsSelected >= 4 ||
                              (quantities[tt.id] || 0) >= tt.remainingQuota
                            }
                            className="w-7 h-7 rounded-lg bg-white border border-soft-gray hover:border-dusty-purple disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-charcoal text-xs shadow-xs transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Total Ringkasan */}
            <div className="border-t border-soft-gray pt-4 mb-6">
              <div className="flex justify-between text-xs text-secondary mb-1.5 font-light">
                <span>Total Tiket Dipilih:</span>
                <span className="font-semibold text-charcoal">
                  {totalTicketsSelected} dari maks 4
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-charcoal font-cinzel">
                <span>Total Harga:</span>
                <span className="text-base text-plum">
                  Rp {calculateTotalPrice().toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <button
              onClick={handleReserve}
              disabled={isSubmitting || totalTicketsSelected === 0}
              className="w-full py-3.5 rounded-xl bg-royal-mauve hover:bg-plum disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-sm hover:shadow"
            >
              {isSubmitting ? 'Memproses Reservasi...' : 'Pesan Tiket Sekarang'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
