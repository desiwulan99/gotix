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
    <div className="max-w-7xl mx-auto py-12 px-6 min-h-screen">
      <div className="border-b border-royal-plum/30 pb-6 mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-muted-violet" />
            <h1 className="text-2xl font-bold font-cinzel text-ivory-white">ADMIN DASHBOARD</h1>
          </div>
          <p className="text-xs text-silver-mist/70 mt-1">
            Kelola event, kuota tiket, dan pantau seluruh transaksi pengguna.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-charcoal p-1 rounded-lg border border-royal-plum/40">
          <button
            onClick={() => setActiveTab('EVENTS')}
            className={`px-4 py-2 rounded text-xs font-medium transition-colors ${
              activeTab === 'EVENTS'
                ? 'bg-royal-plum text-ivory-white font-semibold'
                : 'text-silver-mist hover:text-ivory-white'
            }`}
          >
            Kelola Event
          </button>
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`px-4 py-2 rounded text-xs font-medium transition-colors ${
              activeTab === 'ORDERS'
                ? 'bg-royal-plum text-ivory-white font-semibold'
                : 'text-silver-mist hover:text-ivory-white'
            }`}
          >
            Semua Pesanan ({orders.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-silver-mist text-sm">Memuat data admin...</div>
      ) : activeTab === 'EVENTS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Form Buat Event */}
          <div className="lg:col-span-1 bg-charcoal border border-royal-plum/50 rounded-xl p-6">
            <h3 className="text-sm font-bold font-cinzel text-ivory-white mb-4 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-muted-violet" />
              <span>Buat Event Baru</span>
            </h3>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div>
                <label className="block text-silver-mist mb-1">Judul Event</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: Requiem of Shadows"
                  className="w-full bg-obsidian border border-royal-plum/50 rounded px-3 py-2 text-ivory-white focus:outline-none focus:border-muted-violet"
                />
              </div>

              <div>
                <label className="block text-silver-mist mb-1">Deskripsi</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deskripsi pertunjukan..."
                  className="w-full bg-obsidian border border-royal-plum/50 rounded px-3 py-2 text-ivory-white focus:outline-none focus:border-muted-violet"
                />
              </div>

              <div>
                <label className="block text-silver-mist mb-1">Lokasi</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Misal: Grand Cathedral, Jakarta"
                  className="w-full bg-obsidian border border-royal-plum/50 rounded px-3 py-2 text-ivory-white focus:outline-none focus:border-muted-violet"
                />
              </div>

              <div>
                <label className="block text-silver-mist mb-1">Tanggal Event</label>
                <input
                  type="datetime-local"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-obsidian border border-royal-plum/50 rounded px-3 py-2 text-ivory-white focus:outline-none focus:border-muted-violet"
                />
              </div>

              <div>
                <label className="block text-silver-mist mb-1">URL Poster (Opsional)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-obsidian border border-royal-plum/50 rounded px-3 py-2 text-ivory-white focus:outline-none focus:border-muted-violet"
                />
              </div>

              {/* Tipe Tiket Regular */}
              <div className="pt-2 border-t border-royal-plum/30">
                <span className="font-bold text-silver-mist">Tiket Regular</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <label className="text-[10px] text-silver-mist/60">Harga (Rp)</label>
                    <input
                      type="number"
                      required
                      value={regularPrice}
                      onChange={(e) => setRegularPrice(Number(e.target.value))}
                      className="w-full bg-obsidian border border-royal-plum/50 rounded px-2 py-1.5 text-ivory-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-silver-mist/60">Kuota</label>
                    <input
                      type="number"
                      required
                      value={regularQuota}
                      onChange={(e) => setRegularQuota(Number(e.target.value))}
                      className="w-full bg-obsidian border border-royal-plum/50 rounded px-2 py-1.5 text-ivory-white"
                    />
                  </div>
                </div>
              </div>

              {/* Tipe Tiket VIP */}
              <div className="pt-2 border-t border-royal-plum/30">
                <span className="font-bold text-silver-mist">Tiket VIP</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <label className="text-[10px] text-silver-mist/60">Harga (Rp)</label>
                    <input
                      type="number"
                      required
                      value={vipPrice}
                      onChange={(e) => setVipPrice(Number(e.target.value))}
                      className="w-full bg-obsidian border border-royal-plum/50 rounded px-2 py-1.5 text-ivory-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-silver-mist/60">Kuota</label>
                    <input
                      type="number"
                      required
                      value={vipQuota}
                      onChange={(e) => setVipQuota(Number(e.target.value))}
                      className="w-full bg-obsidian border border-royal-plum/50 rounded px-2 py-1.5 text-ivory-white"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded bg-royal-plum hover:bg-royal-plum/80 text-ivory-white font-bold uppercase tracking-wider transition-colors shadow"
              >
                {isSubmitting ? 'Menyimpan...' : 'Terbitkan Event'}
              </button>
            </form>
          </div>

          {/* Daftar Event yang Ada */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold font-cinzel text-ivory-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-violet" />
              <span>Daftar Event & Status Kuota</span>
            </h3>

            {events.map((event) => (
              <div key={event.id} className="bg-charcoal border border-royal-plum/40 rounded-lg p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-bold font-cinzel text-ivory-white">{event.title}</h4>
                    <p className="text-xs text-silver-mist/60">{event.location}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-royal-plum/40 text-silver-mist border border-royal-plum">
                    {event.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-royal-plum/20">
                  {event.ticketTypes.map((tt) => (
                    <div key={tt.id} className="bg-obsidian/70 p-3 rounded border border-royal-plum/30 text-xs">
                      <div className="flex justify-between font-bold text-ivory-white">
                        <span>{tt.name}</span>
                        <span>Rp {tt.price.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="mt-2 text-[11px] text-silver-mist/70 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Total Kuota:</span>
                          <span className="font-semibold text-ivory-white">{tt.totalQuota}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ditahan (Reserved):</span>
                          <span className="font-semibold text-amber-400">{tt.reservedQuota}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Lunas (Paid):</span>
                          <span className="font-semibold text-emerald-400">{tt.paidQuota}</span>
                        </div>
                        <div className="flex justify-between border-t border-royal-plum/20 pt-1 font-bold text-ivory-white">
                          <span>Sisa Tersedia:</span>
                          <span className={tt.remainingQuota === 0 ? 'text-red-400' : 'text-ivory-white'}>
                            {tt.remainingQuota}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Tab Semua Pesanan */
        <div className="bg-charcoal border border-royal-plum/40 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-royal-plum/30 flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-muted-violet" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-cinzel text-ivory-white">
              Daftar Seluruh Pesanan Pengguna
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-obsidian text-silver-mist/60 border-b border-royal-plum/40">
                <tr>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Pembeli</th>
                  <th className="p-3">Event</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Waktu Buat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-royal-plum/20">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-obsidian/40">
                    <td className="p-3 font-mono text-silver-mist/80">{o.id.slice(0, 8)}...</td>
                    <td className="p-3">
                      <div className="font-medium text-ivory-white">{o.user?.fullName}</div>
                      <div className="text-[10px] text-silver-mist/60">{o.user?.email}</div>
                    </td>
                    <td className="p-3 text-silver-mist">{o.event?.title}</td>
                    <td className="p-3">
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
                    </td>
                    <td className="p-3 font-cinzel font-bold text-ivory-white">
                      Rp {Number(o.totalAmount).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-silver-mist/60">
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
