import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Event } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { EventPoster } from '../components/EventPoster';
import { calcTotal, formatRupiah, maxSelectable } from '../lib/ticketRules';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [quantities, setQuantities] = useState<{ [ticketTypeId: string]: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userActiveTickets, setUserActiveTickets] = useState<number>(0);

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

  // Ambil jumlah tiket aktif (PAID + PENDING) milik user untuk event ini
  useEffect(() => {
    if (!user || !id) return;
    const fetchActiveTickets = async () => {
      try {
        const res = await api.get('/orders');
        const orders = res.data.data?.items || res.data.data || [];
        const activeCount = orders
          .filter((o: any) => {
            if (o.eventId !== id) return false;
            if (o.status === 'PAID') return true;
            if (o.status === 'PENDING_PAYMENT' && new Date(o.expiresAt) > new Date()) return true;
            return false;
          })
          .reduce((sum: number, o: any) => {
            const itemsQty = o.items?.reduce((s: number, it: any) => s + (it.quantity || 0), 0) || 0;
            return sum + itemsQty;
          }, 0);
        setUserActiveTickets(activeCount);
      } catch (_err) {
        // Silently ignore if orders cannot be fetched
      }
    };
    fetchActiveTickets();
  }, [user, id]);

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

  const handleStepperChange = (ticketTypeId: string, delta: number, remaining: number) => {
    const currentQty = quantities[ticketTypeId] || 0;
    const targetQty = currentQty + delta;
    if (targetQty < 0) return;

    // Batas maksimal mutlak: 4 tiket per event (akumulasi tiket aktif user + tiket yang sedang dipilih)
    const remainingAllowance = Math.max(0, 4 - userActiveTickets);

    // Hitung proyeksi total tiket baru jika perubahan ini diterapkan
    const newTotal = Object.entries(quantities).reduce((sum, [id, qty]) => {
      return sum + (id === ticketTypeId ? targetQty : qty);
    }, 0);

    // Jika total tiket baru melebihi batas 4 tiket atau melebihi sisa allowance user, tolak seketika
    if (delta > 0 && (newTotal > remainingAllowance || newTotal > 4)) {
      return;
    }

    // Hitung tiket yang sudah dipilih di tipe tiket lainnya
    const selectedInOtherTypes = Object.entries(quantities)
      .filter(([id]) => id !== ticketTypeId)
      .reduce((sum, [_, qty]) => sum + qty, 0);

    // Dibatasi oleh sisa kuota kursi & batas 4 tiket aktif per pemesan
    const maxAllowed = Math.min(remaining, Math.max(0, remainingAllowance - selectedInOtherTypes));
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

    if (totalTicketsSelected > 4 || (userActiveTickets + totalTicketsSelected > 4)) {
      setErrorMsg('Batas maksimal pembelian adalah 4 tiket per event (dihitung dari pesanan aktif atau sudah dibayar).');
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
            <EventPoster id={event.id} title={event.title} imageUrl={event.imageUrl} />
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
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-cinzel text-base tracking-[0.1em] text-ivory">
                  PILIHAN TIKET
                </h2>
                <span className="text-[11px] font-cinzel text-dusk-rose tracking-wider uppercase">
                  ✦ MAKSIMAL 4 TIKET AKTIF
                </span>
              </div>
              <p className="text-xs text-silver-mist/70 font-inter leading-relaxed">
                Satu pembeli maksimal 4 tiket per event (dihitung dari tiket aktif / PAID + PENDING).
              </p>

              {/* Status Tiket Aktif Milik User */}
              {user && (
                <div className="mt-3 p-3 bg-obsidian border border-silver-mist/20 text-xs text-silver-mist flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>
                    Tiket aktif Anda saat ini:{' '}
                    <strong className="text-dusk-rose font-semibold">{userActiveTickets} tiket</strong> (PAID + PENDING)
                  </span>
                  <span className="text-[11px] font-cinzel text-ivory">
                    Sisa jatah: <strong className="text-dusk-rose">{Math.max(0, 4 - userActiveTickets)}</strong> tiket
                  </span>
                </div>
              )}

              {/* Peringatan jika sudah mencapai 4 tiket */}
              {user && userActiveTickets >= 4 && (
                <div className="mt-3 p-3.5 bg-royal-plum/30 border border-dusk-rose/60 text-center">
                  <span className="font-cinzel text-xs tracking-wider text-dusk-rose uppercase block mb-1">
                    ✦ Batas Maksimal 4 Tiket Aktif Tercapai ✦
                  </span>
                  <p className="text-[11px] text-silver-mist/80">
                    Anda sudah memiliki 4 tiket aktif (PAID / PENDING) untuk event ini. Anda tidak dapat memesan tiket tambahan sampai pesanan dibatalkan atau kedaluwarsa.
                  </p>
                </div>
              )}
            </div>

            {/* Daftar Tipe Tiket */}
            <div className="space-y-4">
              {event.ticketTypes.map((tt) => {
                const remaining = tt.remaining ?? (tt.quota - tt.reservedCount);
                const isSoldOut = remaining <= 0;
                const currentQty = quantities[tt.id] || 0;

                // Hitung tiket yang sudah dipilih di tipe tiket lainnya
                const selectedInOtherTypes = Object.entries(quantities)
                  .filter(([id]) => id !== tt.id)
                  .reduce((sum, [_, qty]) => sum + qty, 0);

                const maxAllowed = maxSelectable(remaining, selectedInOtherTypes, userActiveTickets);
                const isMaxReached = currentQty >= maxAllowed;

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
                              Total kuota event:{' '}
                              <strong className="text-ivory font-semibold">{remaining}</strong> dari{' '}
                              {tt.quota} kursi tersedia
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
                          title={currentQty <= 0 ? 'Jumlah minimal 0' : `Kurangi 1 ${tt.name}`}
                        >
                          −
                        </button>

                        <span className="w-8 text-center font-inter font-bold text-base text-ivory">
                          {currentQty}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleStepperChange(tt.id, 1, remaining)}
                          disabled={isMaxReached || isSoldOut || (userActiveTickets + totalTicketsSelected >= 4)}
                          className="w-10 h-10 flex items-center justify-center bg-obsidian border border-silver-mist/30 text-ivory hover:border-dusk-rose disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-base font-inter"
                          aria-label={`Tambah ${tt.name}`}
                          title={
                            isSoldOut
                              ? 'Tiket habis terjual'
                              : userActiveTickets + totalTicketsSelected >= 4
                              ? 'Batas maksimal 4 tiket aktif per pemesan tercapai'
                              : isMaxReached
                              ? `Maksimal pilihan (${maxAllowed} tiket) telah tercapai`
                              : `Tambah 1 ${tt.name}`
                          }
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
                disabled={
                  totalTicketsSelected === 0 ||
                  totalTicketsSelected > 4 ||
                  isSubmitting ||
                  userActiveTickets >= 4 ||
                  (userActiveTickets + totalTicketsSelected > 4)
                }
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
