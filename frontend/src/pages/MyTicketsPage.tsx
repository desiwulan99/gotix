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
    <div className="max-w-6xl mx-auto py-12 px-6 min-h-screen bg-ivory text-charcoal">
      <div className="border-b border-soft-gray pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-cinzel text-charcoal tracking-wide">
            TIKET & RIWAYAT PESANAN
          </h1>
          <p className="text-xs text-muted-charcoal mt-1 font-light">
            Akses digital pass resmi Anda dengan kode tiket unik dan riwayat transaksi.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-pearl p-1.5 rounded-2xl border border-soft-gray shadow-xs">
          <button
            onClick={() => setActiveTab('TICKETS')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'TICKETS'
                ? 'bg-white text-plum font-semibold shadow-sm'
                : 'text-muted-charcoal hover:text-charcoal'
            }`}
          >
            Tiket Aktif ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'ORDERS'
                ? 'bg-white text-plum font-semibold shadow-sm'
                : 'text-muted-charcoal hover:text-charcoal'
            }`}
          >
            Riwayat Pesanan ({orders.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-secondary text-xs">Memuat data...</div>
      ) : activeTab === 'TICKETS' ? (
        /* Tab Tiket Aktif */
        tickets.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-soft-gray shadow-soft-card">
            <p className="text-muted-charcoal text-xs">Belum ada tiket yang diterbitkan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tickets.map((t) => {
              const isVIP = t.ticketType?.name.toUpperCase().includes('VIP');
              return (
                <div
                  key={t.id}
                  className="bg-white border border-soft-gray hover:border-dusty-purple/60 rounded-3xl overflow-hidden shadow-soft-card hover:shadow-soft-hover transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span
                          className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full border ${
                            isVIP
                              ? 'bg-soft-lavender text-plum border-dusty-purple/60'
                              : 'bg-pearl text-muted-charcoal border-soft-gray'
                          }`}
                        >
                          {t.ticketType?.name}
                        </span>
                        <h3 className="text-base font-bold font-cinzel text-charcoal mt-2.5">
                          {t.order?.event?.title}
                        </h3>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {t.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-1.5 text-xs text-muted-charcoal font-light">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-royal-mauve" />
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
                        <MapPin className="w-3.5 h-3.5 text-royal-mauve" />
                        <span>{t.order?.event?.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Kode Tiket Unik & QR Bar */}
                  <div className="bg-pearl/50 border-t border-dashed border-soft-gray px-6 py-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-secondary font-semibold block">
                        KODE TIKET UNIK
                      </span>
                      <span className="text-sm font-mono font-bold tracking-widest text-charcoal">
                        {t.ticketCode}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-soft-gray shadow-xs">
                      <QrCode className="w-6 h-6 text-royal-mauve" />
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
          <div className="text-center py-20 bg-white rounded-2xl border border-soft-gray shadow-soft-card">
            <p className="text-muted-charcoal text-xs">Belum ada riwayat pesanan.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-white border border-soft-gray rounded-2xl p-5 shadow-soft-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-bold font-cinzel text-charcoal">
                      {o.event?.title}
                    </h4>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        o.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : o.status === 'PENDING_PAYMENT'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <p className="text-xs text-secondary mt-1 font-light">
                    Dipesan pada {new Date(o.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="text-right flex sm:flex-col items-center sm:items-end justify-between">
                  <span className="text-xs text-secondary font-light">Total Pembayaran</span>
                  <span className="text-sm font-bold font-cinzel text-charcoal">
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
