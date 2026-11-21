import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Event } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { EventPoster } from '../components/EventPoster';
import { maxSelectable, calcTotal, formatRupiah } from '../lib/ticketRules';

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
        setErrorMsg(err.message || 'Gagal memuat detail event');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-16 px-4 text-center">
        <div className="animate-pulse text-dusk-rose text-2xl select-none mb-3">✦</div>
        <p className="font-cinzel text-xs tracking-[0.2em] uppercase text-silver-mist">
          Memuat detail event...
        </p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <h2 className="font-cinzel text-xl text-ivory mb-4">Event Tidak Ditemukan</h2>
        <Link to="/events" className="font-cinzel text-xs tracking-[0.2em] text-dusk-rose underline">
          KEMBALI KE KATALOG EVENT
        </Link>
      </div>
    );
  }

  // Hitung total tiket yang sedang dipilih
  const totalTicketsSelected = Object.values(quantities).reduce((a, b) => a + b, 0);

  // Hitung tiket yang dipilih pada tipe lain
  const getSelectedInOtherTypes = (currentTypeId: string) => {
    return Object.entries(quantities).reduce((sum, [tId, qty]) => {
      return sum + (tId === currentTypeId ? 0 : qty);
    }, 0);
  };

  const handleStepperChange = (ticketTypeId: string, delta: number, remaining: number) => {
    const currentQty = quantities[ticketTypeId] || 0;
    const selectedInOthers = getSelectedInOtherTypes(ticketTypeId);
    const maxAllowed = maxSelectable(remaining, selectedInOthers, 0);

    const targetQty = currentQty + delta;
    if (targetQty < 0) return;
    if (targetQty > maxAllowed) return;

    setQuantities({
      ...quantities,
      [ticketTypeId]: targetQty,
    });
    setErrorMsg(null);
  };

  const totalPrice = calcTotal(
    event.ticketTypes.map((tt) => ({
      quantity: quantities[tt.id] || 0,
      unitPrice: Number(tt.price),
    }))
  );

  const handleReserve = async () => {
    if (!user) {
      navigate(`/masuk?redirect=${encodeURIComponent(`/events/${event.id}`)}`);
      return;
    }

    if (totalTicketsSelected === 0) {
      setErrorMsg('Silakan pilih minimal 1 tiket untuk melanjutkan pemesanan.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const items = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));

    try {
      const res = await api.post('/orders', {
        eventId: event.id,
        items,
      });
      const order = res.data.data;
      navigate(`/checkout/${order.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membuat reservasi tiket');
      // Ambil ulang data event agar status kuota terbaru selalu sinkron dengan server
      try {
        const refreshed = await api.get(`/events/${id}`);
        setEvent(refreshed.data.data);
      } catch (_e) {}
    } finally {
      setIsSubmitting(false);
    }
  };

  const eventDateObj = new Date(event.startsAt || event.eventDate || Date.now());
  const dateFormatted = eventDateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 min-h-screen bg-obsidian text-ivory">
      {/* Tautan Kembali */}
      <div className="mb-8 text-left">
        <Link
          to="/events"
          className="font-cinzel text-xs tracking-[0.2em] uppercase text-silver-mist/70 hover:text-dusk-rose transition-colors inline-flex items-center space-x-2"
        >
          <span>←</span>
          <span>Kembali ke Daftar Event</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Kolom Kiri: Poster Kartu Tarot Besar */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-sm sticky top-24">
            <EventPoster id={event.id} title={event.title} />
          </div>
        </div>

        {/* Kolom Kanan: Deskripsi, Tipe Tiket, dan Pemesanan */}
        <div className="lg:col-span-7 flex flex-col justify-between text-left space-y-8">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-dusk-rose font-cinzel block mb-1">
              ✦ CURATED EXPERIENCE ✦
            </span>
            <h1 className="font-cinzel text-2xl sm:text-4xl text-ivory tracking-[0.04em] leading-tight mb-4">
              {event.title}
            </h1>

            {/* Waktu & Lokasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-silver-mist/15 text-xs text-silver-mist/90">
              <div>
                <span className="block text-[10px] uppercase font-cinzel text-silver-mist/50 tracking-wider">
                  Waktu Pelaksanaan
                </span>
                <span className="font-inter font-medium text-ivory">{dateFormatted}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-cinzel text-silver-mist/50 tracking-wider">
                  Lokasi
                </span>
                <span className="font-inter font-medium text-ivory">{event.location}</span>
              </div>
            </div>

            {/* Deskripsi Event */}
            <div className="pt-6">
              <h3 className="font-cinzel text-xs tracking-[0.2em] uppercase text-silver-mist/60 mb-2">
                DESKRIPSI
              </h3>
              <p className="font-inter text-sm text-silver-mist/80 leading-relaxed">
                {event.description}
              </p>
            </div>
          </div>

          {/* Bagian Pilihan Tiket (Regular / VIP) */}
          <div className="space-y-6 pt-4 border-t border-silver-mist/15">
            <div>
              <h2 className="font-cinzel text-base tracking-[0.1em] text-ivory">
                PILIHAN TIKET
              </h2>
              <p className="text-xs text-silver-mist/60 font-inter mt-0.5">
                Maksimal 4 tiket aktif per pemesan untuk setiap event.
              </p>
            </div>

            {/* Daftar Tipe Tiket */}
            <div className="space-y-4">
              {event.ticketTypes.map((tt) => {
                const remaining = tt.remaining ?? (tt.quota - tt.reservedCount);
                const isSoldOut = remaining <= 0;
                const currentQty = quantities[tt.id] || 0;
                const selectedInOthers = getSelectedInOtherTypes(tt.id);
                const maxAllowed = maxSelectable(remaining, selectedInOthers, 0);

                // Progress bar sisa kuota tipis
                const percentRemaining = tt.quota > 0 ? (remaining / tt.quota) * 100 : 0;

                return (
                  <div
                    key={tt.id}
                    className={`p-5 bg-charcoal border transition-all ${
                      currentQty > 0
                        ? 'border-dusk-rose/80 shadow-gothic-card'
                        : 'border-silver-mist/20 hover:border-silver-mist/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Info Tipe Tiket */}
                      <div className="space-y-1">
                        <h4 className="font-cinzel text-base text-ivory tracking-wider">
                          {tt.name}
                        </h4>
                        <div className="font-inter font-semibold text-lg text-dusk-rose">
                          {formatRupiah(Number(tt.price))}
                        </div>

                        {/* Status Sisa Kuota berupa angka */}
                        <div className="text-xs font-inter text-silver-mist/70 pt-1 flex items-center space-x-2">
                          {isSoldOut ? (
                            <span className="text-dusk-rose font-cinzel text-[11px] tracking-widest">
                              HABIS TERJUAL (0/{tt.quota})
                            </span>
                          ) : (
                            <span>
                              Sisa kuota:{' '}
                              <strong className="text-ivory font-semibold">{remaining}</strong> dari{' '}
                              {tt.quota}
                            </span>
                          )}
                        </div>

                        {/* Progress Bar Tipis Sisa Kuota */}
                        <div className="w-40 h-[2px] bg-obsidian overflow-hidden mt-1.5">
                          <div
                            className={`h-full transition-all duration-300 ${
                              percentRemaining < 20 ? 'bg-dusk-rose' : 'bg-muted-violet'
                            }`}
                            style={{ width: `${percentRemaining}%` }}
                          />
                        </div>
                      </div>

                      {/* Stepper Jumlah Tiket (Target Sentuh Minimal 40px) */}
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => handleStepperChange(tt.id, -1, remaining)}
                          disabled={currentQty <= 0 || isSoldOut}
                          className="w-10 h-10 flex items-center justify-center bg-obsidian border border-silver-mist/30 text-ivory hover:border-dusk-rose disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-base font-inter"
                          aria-label={`Kurangi ${tt.name}`}
                        >
                          −
                        </button>

                        <span className="w-8 text-center font-inter font-bold text-base text-ivory">
                          {currentQty}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleStepperChange(tt.id, 1, remaining)}
                          disabled={currentQty >= maxAllowed || isSoldOut}
                          className="w-10 h-10 flex items-center justify-center bg-obsidian border border-silver-mist/30 text-ivory hover:border-dusk-rose disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-base font-inter"
                          aria-label={`Tambah ${tt.name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Error Message Box dari Backend */}
            {errorMsg && (
              <div className="p-4 bg-royal-plum/30 border border-red-500/50 text-red-200 text-xs font-inter">
                {errorMsg}
              </div>
            )}

            {/* Ringkasan Harga & Tombol Pesan */}
            <div className="p-6 bg-charcoal border border-silver-mist/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <span className="block text-[11px] font-cinzel uppercase tracking-wider text-silver-mist/60">
                  Total Pembelian ({totalTicketsSelected} tiket)
                </span>
                <span className="font-inter font-bold text-2xl text-ivory">
                  {formatRupiah(totalPrice)}
                </span>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleReserve}
                disabled={totalTicketsSelected === 0 || isSubmitting}
                isLoading={isSubmitting}
                className="w-full sm:w-auto px-10"
              >
                Pesan Tiket Sekarang
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
