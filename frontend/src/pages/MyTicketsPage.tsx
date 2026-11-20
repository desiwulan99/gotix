import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Ticket, Order } from '../types';
import { Calendar, MapPin, QrCode } from 'lucide-react';

export const MyTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'ORDERS'>('TICKETS');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketRes, orderRes] = await Promise.all([
          api.get('/tickets'),
          api.get('/orders'),
        ]);
        setTickets(ticketRes.data.data);
        setOrders(orderRes.data.data);
      } catch (err) {
        console.error('Error fetching tickets or orders:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 min-h-screen">
      <div className="border-b border-royal-plum/30 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-cinzel text-ivory-white tracking-wider">
            TIKET & RIWAYAT PESANAN
          </h1>
          <p className="text-xs text-silver-mist/70 mt-1">
            Lihat tiket resmi Anda beserta kode tiket unik dan histori transaksi.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-charcoal p-1 rounded-lg border border-royal-plum/40">
          <button
            onClick={() => setActiveTab('TICKETS')}
            className={`px-4 py-2 rounded text-xs font-medium transition-colors ${
              activeTab === 'TICKETS'
                ? 'bg-royal-plum text-ivory-white font-semibold shadow'
                : 'text-silver-mist hover:text-ivory-white'
            }`}
          >
            Tiket Aktif ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`px-4 py-2 rounded text-xs font-medium transition-colors ${
              activeTab === 'ORDERS'
                ? 'bg-royal-plum text-ivory-white font-semibold shadow'
                : 'text-silver-mist hover:text-ivory-white'
            }`}
          >
            Riwayat Pesanan ({orders.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-silver-mist text-sm">Memuat data...</div>
      ) : activeTab === 'TICKETS' ? (
        /* Tab Tiket Aktif */
        tickets.length === 0 ? (
          <div className="text-center py-20 bg-charcoal/40 rounded-lg border border-royal-plum/30">
            <p className="text-silver-mist text-sm">Belum ada tiket yang diterbitkan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="bg-charcoal border border-royal-plum/60 hover:border-muted-violet/60 rounded-xl overflow-hidden shadow-xl flex flex-col justify-between"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-royal-plum/40 text-silver-mist border border-royal-plum">
                        {t.ticketType?.name}
                      </span>
                      <h3 className="text-lg font-bold font-cinzel text-ivory-white mt-2">
                        {t.order?.event?.title}
                      </h3>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      {t.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-silver-mist/70">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-muted-violet" />
                      <span>
                        {t.order?.event?.eventDate &&
                          new Date(t.order.event.eventDate).toLocaleDateString('id-ID', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-muted-violet" />
                      <span>{t.order?.event?.location}</span>
                    </div>
                  </div>
                </div>

                {/* Kode Tiket Unik & QR Bar */}
                <div className="bg-obsidian border-t border-dashed border-royal-plum/60 px-6 py-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-silver-mist/60 block">
                      KODE TIKET UNIK
                    </span>
                    <span className="text-sm font-mono font-bold tracking-widest text-ivory-white">
                      {t.ticketCode}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-charcoal border border-royal-plum/40">
                    <QrCode className="w-6 h-6 text-muted-violet" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Tab Riwayat Pesanan */
        orders.length === 0 ? (
          <div className="text-center py-20 bg-charcoal/40 rounded-lg border border-royal-plum/30">
            <p className="text-silver-mist text-sm">Belum ada riwayat pesanan.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-charcoal border border-royal-plum/40 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-bold font-cinzel text-ivory-white">
                      {o.event?.title}
                    </h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        o.status === 'PAID'
                          ? 'bg-emerald-950 text-emerald-300'
                          : o.status === 'PENDING_PAYMENT'
                          ? 'bg-amber-950 text-amber-300'
                          : 'bg-red-950 text-red-300'
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <p className="text-xs text-silver-mist/60 mt-1">
                    Dipesan pada {new Date(o.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="text-right flex sm:flex-col items-center sm:items-end justify-between">
                  <span className="text-xs text-silver-mist/70">Total</span>
                  <span className="text-sm font-bold font-cinzel text-ivory-white">
                    Rp {Number(o.totalAmount).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
