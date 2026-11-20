import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Event, Order } from '../types';
import { PlusCircle, Shield, ListOrdered, Calendar } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'EVENTS' | 'ORDERS'>('EVENTS');
  const [events, setEvents] = useState<Event[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State Event Baru
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [regularPrice, setRegularPrice] = useState(150000);
  const [regularQuota, setRegularQuota] = useState(100);
  const [vipPrice, setVipPrice] = useState(450000);
  const [vipQuota, setVipQuota] = useState(25);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [eventRes, orderRes] = await Promise.all([
        api.get('/events'),
        api.get('/orders/admin/all'),
      ]);
      setEvents(eventRes.data.data);
      setOrders(orderRes.data.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/events', {
        title,
        description,
        location,
        eventDate: new Date(eventDate).toISOString(),
        imageUrl: imageUrl || null,
        ticketTypes: [
          { name: 'Regular', price: regularPrice, totalQuota: regularQuota },
          { name: 'VIP', price: vipPrice, totalQuota: vipQuota },
        ],
      });

      alert('Event berhasil dibuat!');
      setTitle('');
      setDescription('');
      setLocation('');
      setEventDate('');
      setImageUrl('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal membuat event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 min-h-screen bg-ivory text-charcoal">
      <div className="border-b border-soft-gray pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-royal-mauve" />
            <h1 className="text-2xl font-bold font-cinzel text-charcoal">ADMIN DASHBOARD</h1>
          </div>
          <p className="text-xs text-muted-charcoal mt-1 font-light">
            Kelola event, kuota tiket, dan pantau seluruh transaksi pengguna.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-pearl p-1.5 rounded-2xl border border-soft-gray shadow-xs">
          <button
            onClick={() => setActiveTab('EVENTS')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'EVENTS'
                ? 'bg-white text-plum font-semibold shadow-sm'
                : 'text-muted-charcoal hover:text-charcoal'
            }`}
          >
            Kelola Event
          </button>
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'ORDERS'
                ? 'bg-white text-plum font-semibold shadow-sm'
                : 'text-muted-charcoal hover:text-charcoal'
            }`}
          >
            Semua Pesanan ({orders.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-secondary text-xs">Memuat data admin...</div>
      ) : activeTab === 'EVENTS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Form Buat Event */}
          <div className="lg:col-span-1 bg-white border border-soft-gray rounded-3xl p-6 shadow-soft-card">
            <h3 className="text-sm font-bold font-cinzel text-charcoal mb-5 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-royal-mauve" />
              <span>Buat Event Baru</span>
            </h3>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div>
                <label className="block text-muted-charcoal mb-1 font-medium">Judul Event</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: Lavender Symphony"
                  className="w-full bg-pearl border border-soft-gray rounded-xl px-3.5 py-2.5 text-charcoal focus:outline-none focus:border-royal-mauve focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-muted-charcoal mb-1 font-medium">Deskripsi</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deskripsi pertunjukan..."
                  className="w-full bg-pearl border border-soft-gray rounded-xl px-3.5 py-2.5 text-charcoal focus:outline-none focus:border-royal-mauve focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-muted-charcoal mb-1 font-medium">Lokasi</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Misal: Grand Ballroom, Jakarta"
                  className="w-full bg-pearl border border-soft-gray rounded-xl px-3.5 py-2.5 text-charcoal focus:outline-none focus:border-royal-mauve focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-muted-charcoal mb-1 font-medium">Tanggal Event</label>
                <input
                  type="datetime-local"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-pearl border border-soft-gray rounded-xl px-3.5 py-2.5 text-charcoal focus:outline-none focus:border-royal-mauve focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-muted-charcoal mb-1 font-medium">URL Poster (Opsional)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-pearl border border-soft-gray rounded-xl px-3.5 py-2.5 text-charcoal focus:outline-none focus:border-royal-mauve focus:bg-white transition-all"
                />
              </div>

              {/* Tipe Tiket Regular */}
              <div className="pt-3 border-t border-soft-gray/60">
                <span className="font-bold text-charcoal font-cinzel text-xs">Tiket Regular</span>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <div>
                    <label className="text-[10px] text-secondary font-medium">Harga (Rp)</label>
                    <input
                      type="number"
                      required
                      value={regularPrice}
                      onChange={(e) => setRegularPrice(Number(e.target.value))}
                      className="w-full bg-pearl border border-soft-gray rounded-xl px-2.5 py-2 text-charcoal"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-secondary font-medium">Kuota</label>
                    <input
                      type="number"
                      required
                      value={regularQuota}
                      onChange={(e) => setRegularQuota(Number(e.target.value))}
                      className="w-full bg-pearl border border-soft-gray rounded-xl px-2.5 py-2 text-charcoal"
                    />
                  </div>
                </div>
              </div>

              {/* Tipe Tiket VIP */}
              <div className="pt-3 border-t border-soft-gray/60">
                <span className="font-bold text-plum font-cinzel text-xs">Tiket VIP</span>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <div>
                    <label className="text-[10px] text-secondary font-medium">Harga (Rp)</label>
                    <input
                      type="number"
                      required
                      value={vipPrice}
                      onChange={(e) => setVipPrice(Number(e.target.value))}
                      className="w-full bg-pearl border border-soft-gray rounded-xl px-2.5 py-2 text-charcoal"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-secondary font-medium">Kuota</label>
                    <input
                      type="number"
                      required
                      value={vipQuota}
                      onChange={(e) => setVipQuota(Number(e.target.value))}
                      className="w-full bg-pearl border border-soft-gray rounded-xl px-2.5 py-2 text-charcoal"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-royal-mauve hover:bg-plum text-white font-semibold uppercase tracking-wider transition-all shadow-sm"
              >
                {isSubmitting ? 'Menyimpan...' : 'Terbitkan Event'}
              </button>
            </form>
          </div>

          {/* Daftar Event yang Ada */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold font-cinzel text-charcoal flex items-center gap-2">
              <Calendar className="w-4 h-4 text-royal-mauve" />
              <span>Daftar Event & Status Kuota</span>
            </h3>

            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white border border-soft-gray rounded-3xl p-6 shadow-soft-card"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-bold font-cinzel text-charcoal">
                      {event.title}
                    </h4>
                    <p className="text-xs text-secondary font-light mt-0.5">
                      {event.location}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase bg-soft-lavender text-plum border border-dusty-purple/30">
                    {event.status}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-soft-gray/60">
                  {event.ticketTypes.map((tt) => {
                    const isVIP = tt.name.toUpperCase().includes('VIP');
                    return (
                      <div
                        key={tt.id}
                        className={`p-3.5 rounded-2xl border text-xs ${
                          isVIP
                            ? 'bg-soft-lavender/30 border-dusty-purple/50'
                            : 'bg-pearl/40 border-soft-gray'
                        }`}
                      >
                        <div className="flex justify-between font-bold text-charcoal">
                          <span>{tt.name}</span>
                          <span className="text-plum">Rp {tt.price.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="mt-2 text-[11px] text-muted-charcoal/80 space-y-1 font-light">
                          <div className="flex justify-between">
                            <span>Total Kuota:</span>
                            <span className="font-semibold text-charcoal">{tt.totalQuota}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Ditahan (Reserved):</span>
                            <span className="font-semibold text-amber-600">{tt.reservedQuota}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Lunas (Paid):</span>
                            <span className="font-semibold text-emerald-600">{tt.paidQuota}</span>
                          </div>
                          <div className="flex justify-between border-t border-soft-gray/40 pt-1 font-bold text-charcoal">
                            <span>Sisa Tersedia:</span>
                            <span className={tt.remainingQuota === 0 ? 'text-red-500' : 'text-plum'}>
                              {tt.remainingQuota}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Tab Semua Pesanan */
        <div className="bg-white border border-soft-gray rounded-3xl overflow-hidden shadow-soft-card">
          <div className="p-5 border-b border-soft-gray flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-royal-mauve" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-cinzel text-charcoal">
              Daftar Seluruh Pesanan Pengguna
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-pearl text-secondary font-medium border-b border-soft-gray">
                <tr>
                  <th className="p-3.5">Order ID</th>
                  <th className="p-3.5">Pembeli</th>
                  <th className="p-3.5">Event</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Total Amount</th>
                  <th className="p-3.5">Waktu Buat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soft-gray/60">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-pearl/30 transition-colors">
                    <td className="p-3.5 font-mono text-secondary">{o.id.slice(0, 8)}...</td>
                    <td className="p-3.5">
                      <div className="font-medium text-charcoal">{o.user?.fullName}</div>
                      <div className="text-[10px] text-secondary font-light">{o.user?.email}</div>
                    </td>
                    <td className="p-3.5 text-muted-charcoal">{o.event?.title}</td>
                    <td className="p-3.5">
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
                    </td>
                    <td className="p-3.5 font-cinzel font-bold text-charcoal">
                      Rp {Number(o.totalAmount).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3.5 text-secondary font-light">
                      {new Date(o.createdAt).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
