import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';
import { Ticket, Order } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { formatRupiah } from '../lib/ticketRules';

export const MyTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'ORDERS'>('TICKETS');
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketRes, orderRes] = await Promise.all([
          api.get('/tickets'),
          api.get('/orders'),
        ]);
        setTickets(Array.isArray(ticketRes.data.data) ? ticketRes.data.data : []);
        setOrders(Array.isArray(orderRes.data.data) ? orderRes.data.data : []);
      } catch (err) {
        console.error('Error fetching tickets or orders:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 min-h-screen bg-obsidian text-ivory">
      {/* Header Halaman */}
      <div className="border-b border-silver-mist/15 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 text-left">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-dusk-rose font-cinzel">
            ✦ DOKUMEN DIGITAL ✦
          </span>
          <h1 className="text-2xl sm:text-3xl font-normal font-cinzel text-ivory tracking-[0.05em] mt-1">
            TIKET & RIWAYAT PESANAN
          </h1>
          <p className="text-xs text-silver-mist/70 mt-1 font-inter">
            Akses digital pass resmi Anda dengan kode tiket unik dan riwayat transaksi.
          </p>
        </div>

        {/* Tab Switcher Gaya Soul Cards */}
        <div className="flex items-center space-x-8">
          <button
            onClick={() => setActiveTab('TICKETS')}
            className={`font-cinzel text-xs tracking-[0.2em] uppercase py-1 transition-all ${
              activeTab === 'TICKETS'
                ? 'text-dusk-rose underline underline-offset-8 decoration-dusk-rose'
                : 'text-silver-mist/60 hover:text-ivory'
            }`}
          >
            Tiket Saya ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`font-cinzel text-xs tracking-[0.2em] uppercase py-1 transition-all ${
              activeTab === 'ORDERS'
                ? 'text-dusk-rose underline underline-offset-8 decoration-dusk-rose'
                : 'text-silver-mist/60 hover:text-ivory'
            }`}
          >
            Riwayat Pesanan ({orders.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-silver-mist/60 text-xs font-cinzel tracking-widest uppercase">
          Memuat data tiket & riwayat...
        </div>
      ) : activeTab === 'TICKETS' ? (
        /* Tab Tiket Saya */
        tickets.length === 0 ? (
          <EmptyState
            title="Belum Ada Tiket yang Diterbitkan"
            description="Anda belum memiliki tiket aktif. Pilih event dan selesaikan pembayaran untuk mendapatkan pass resmi."
            actionText="JELAJAHI EVENT SEKARANG"
            onAction={() => (window.location.href = '/events')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            {tickets.map((t) => {
              const code = t.code || t.ticketCode || 'GTX-UNKNOWN';
              return (
                <div
                  key={t.id}
                  className="bg-charcoal border border-silver-mist/20 p-6 flex flex-col justify-between space-y-6 relative overflow-hidden"
                >
                  {/* Ornamen ganda sudut */}
                  <div className="absolute top-2 right-2 text-[8px] text-dusk-rose select-none">✦</div>

                  <div>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <span className="text-[10px] uppercase font-cinzel tracking-[0.2em] text-dusk-rose">
                          {t.ticketType?.name || 'REGULAR'} PASS
                        </span>
                        <h3 className="font-cinzel text-base text-ivory tracking-wide mt-1">
                          {t.order?.event?.title || 'Event GOTIX'}
                        </h3>
                      </div>
                      <StatusBadge status={t.status} />
                    </div>

                    <p className="text-xs text-silver-mist/70 font-inter">
                      {t.order?.event?.location}
                    </p>
                  </div>

                  {/* Bagian QR Code & Kode Tiket Unik */}
                  <div className="pt-4 border-t border-silver-mist/15 flex flex-col sm:flex-row items-center justify-between gap-6">
                    {/* QR Code SVG Offline */}
                    <div className="bg-obsidian p-3 border border-silver-mist/20 shrink-0">
                      <QRCodeSVG
                        value={code}
                        size={100}
                        bgColor="#0D0B10"
                        fgColor="#F2EFF4"
                        level="M"
                      />
                    </div>

                    <div className="flex flex-col items-center sm:items-end space-y-2 w-full">
                      <span className="text-[10px] font-cinzel uppercase tracking-wider text-silver-mist/50">
                        Kode Tiket Unik
                      </span>
                      <span className="font-mono font-bold text-sm tracking-widest text-dusk-rose bg-obsidian px-3 py-1.5 border border-silver-mist/20">
                        {code}
                      </span>

                      <button
                        onClick={() => handleCopyCode(code)}
                        className="font-cinzel text-[11px] tracking-[0.15em] uppercase text-silver-mist hover:text-ivory underline underline-offset-4 transition-colors"
                      >
                        {copiedCode === code ? '✓ Tersalin!' : 'Salin Kode Tiket'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Tab Riwayat Pesanan */
        orders.length === 0 ? (
          <EmptyState
            title="Belum Ada Riwayat Pesanan"
            description="Riwayat pesanan tiket Anda akan tercatat secara otomatis di sini."
            actionText="PESAN TIKET SEKARANG"
            onAction={() => (window.location.href = '/events')}
          />
        ) : (
          <div className="space-y-4 text-left">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-charcoal border border-silver-mist/20 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs text-silver-mist/60">
                      #{o.id.substring(0, 8)}
                    </span>
                    <StatusBadge status={o.status} />
                  </div>
                  <h4 className="font-cinzel text-base text-ivory tracking-wide pt-1">
                    {o.event?.title || 'Event GOTIX'}
                  </h4>
                  <p className="text-xs text-silver-mist/70 font-inter">
                    {new Date(o.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="flex flex-col sm:items-end justify-between space-y-2">
                  <span className="font-inter font-bold text-lg text-dusk-rose">
                    {formatRupiah(Number(o.totalAmount))}
                  </span>

                  {o.status === 'PENDING_PAYMENT' && (
                    <a
                      href={`/checkout/${o.id}`}
                      className="font-cinzel text-xs tracking-[0.15em] uppercase text-dusk-rose hover:text-ivory underline underline-offset-4"
                    >
                      Lanjutkan Pembayaran →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
