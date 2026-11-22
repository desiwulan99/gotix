import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Event, Order } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { formatRupiah } from '../lib/ticketRules';

export const AdminPage: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'EVENTS' | 'ORDERS'>('EVENTS');
  const [events, setEvents] = useState<Event[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [, setIsLoading] = useState(true);

  // Form State Event Baru
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [regularPrice, setRegularPrice] = useState(150000);
  const [regularQuota, setRegularQuota] = useState(100);
  const [vipPrice, setVipPrice] = useState(450000);
  const [vipQuota, setVipQuota] = useState(25);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Route Guard: Hanya role ADMIN yang diizinkan
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || user?.role !== 'ADMIN') {
        navigate('/');
      }
    }
  }, [user, isAuthenticated, authLoading, navigate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [eventRes, orderRes] = await Promise.all([
        api.get('/events'),
        api.get('/admin/orders'),
      ]);
      setEvents(Array.isArray(eventRes.data.data) ? eventRes.data.data : []);
      setOrders(Array.isArray(orderRes.data.data) ? orderRes.data.data : []);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchData();
    }
  }, [user]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!title.trim() || title.trim().length < 3) {
      setMessage({ type: 'error', text: 'Judul event minimal 3 karakter' });
      return;
    }
    if (!description.trim() || description.trim().length < 3) {
      setMessage({ type: 'error', text: 'Deskripsi event minimal 3 karakter' });
      return;
    }
    if (!location.trim() || location.trim().length < 3) {
      setMessage({ type: 'error', text: 'Lokasi event minimal 3 karakter' });
      return;
    }
    if (!startsAt) {
      setMessage({ type: 'error', text: 'Waktu pelaksanaan event wajib diisi' });
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/events', {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        startsAt: new Date(startsAt).toISOString(),
        ticketTypes: [
          { name: 'Regular', price: Number(regularPrice), quota: Number(regularQuota) },
          { name: 'VIP', price: Number(vipPrice), quota: Number(vipQuota) },
        ],
      });

      setMessage({ type: 'success', text: 'Event berhasil dipublikasikan ke katalog!' });
      setTitle('');
      setDescription('');
      setLocation('');
      setStartsAt('');
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal membuat event' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string, eventTitle: string) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus event "${eventTitle}"?\n\nPerhatian: Seluruh tipe tiket dan histori terkait event ini akan dihapus secara permanen.`
    );
    if (!confirmed) return;

    setDeletingId(id);
    setMessage(null);

    try {
      await api.delete(`/events/${id}`);
      setMessage({ type: 'success', text: `Event "${eventTitle}" berhasil dihapus!` });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal menghapus event' });
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center text-silver-mist text-xs font-cinzel">
        Memeriksa hak akses administrator...
      </div>
    );
  }

  // Statistik Ringkas
  const totalRevenue = orders
    .filter((o) => o.status === 'PAID')
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);

  const totalTicketsSold = orders
    .filter((o) => o.status === 'PAID')
    .reduce((sum, o) => sum + o.items.reduce((iSum, item) => iSum + item.quantity, 0), 0);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 min-h-screen bg-obsidian text-ivory text-left">
      {/* Header Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-silver-mist/15 gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-dusk-rose font-cinzel">
            ✦ KURATOR KONTROL ✦
          </span>
          <h1 className="text-2xl sm:text-3xl font-normal font-cinzel text-ivory tracking-[0.05em] mt-0.5">
            ADMIN DASHBOARD
          </h1>
          <p className="text-xs text-silver-mist/70 mt-1 font-inter">
            Kelola katalog event, atur kuota tiket fisik, dan pantau seluruh histori transaksi secara langsung.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-8">
          <button
            onClick={() => setActiveTab('EVENTS')}
            className={`font-cinzel text-xs tracking-[0.2em] uppercase py-1 transition-all ${
              activeTab === 'EVENTS'
                ? 'text-dusk-rose underline underline-offset-8 decoration-dusk-rose'
                : 'text-silver-mist/60 hover:text-ivory'
            }`}
          >
            Kelola Event ({events.length})
          </button>
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`font-cinzel text-xs tracking-[0.2em] uppercase py-1 transition-all ${
              activeTab === 'ORDERS'
                ? 'text-dusk-rose underline underline-offset-8 decoration-dusk-rose'
                : 'text-silver-mist/60 hover:text-ivory'
            }`}
          >
            Semua Pesanan ({orders.length})
          </button>
        </div>
      </div>

      {/* Metric Cards Ringkas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="p-5 bg-charcoal border border-silver-mist/20">
          <span className="block text-[10px] font-cinzel uppercase tracking-wider text-silver-mist/60">
            Total Pendapatan Lunas
          </span>
          <span className="font-inter font-bold text-2xl text-dusk-rose mt-1 block">
            {formatRupiah(totalRevenue)}
          </span>
        </div>
        <div className="p-5 bg-charcoal border border-silver-mist/20">
          <span className="block text-[10px] font-cinzel uppercase tracking-wider text-silver-mist/60">
            Tiket Terjual Lunas
          </span>
          <span className="font-inter font-bold text-2xl text-ivory mt-1 block">
            {totalTicketsSold} Tiket
          </span>
        </div>
        <div className="p-5 bg-charcoal border border-silver-mist/20">
          <span className="block text-[10px] font-cinzel uppercase tracking-wider text-silver-mist/60">
            Total Event Terdaftar
          </span>
          <span className="font-inter font-bold text-2xl text-ivory mt-1 block">
            {events.length} Event
          </span>
        </div>
      </div>

      {activeTab === 'EVENTS' ? (
        <div className="space-y-12">
          {/* Form Buat Event Baru */}
          <div className="p-6 sm:p-8 bg-charcoal border border-silver-mist/20">
            <h2 className="font-cinzel text-lg text-ivory tracking-wide mb-6">
              BUAT EVENT BARU
            </h2>

            {message && (
              <div
                className={`p-4 mb-6 text-xs font-inter border ${
                  message.type === 'success'
                    ? 'border-emerald-500/60 bg-obsidian text-emerald-300'
                    : 'border-red-500/60 bg-obsidian text-red-300'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Judul Event"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Nocturnal Symphony"
                  required
                />
                <Input
                  label="Lokasi"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Contoh: Grand Obsidian Hall, Jakarta"
                  required
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.15em] font-cinzel text-silver-mist/80 mb-1.5">
                  Deskripsi Event
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deskripsikan pengalaman event dan atmosfer malam..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-obsidian border border-silver-mist/20 text-ivory placeholder-silver-mist/40 text-sm font-inter focus:outline-none focus:border-dusk-rose"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Waktu Pelaksanaan"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  required
                />
              </div>

              {/* Tipe Tiket: Regular & VIP */}
              <div className="pt-4 border-t border-silver-mist/15">
                <h4 className="font-cinzel text-xs tracking-[0.2em] uppercase text-dusk-rose mb-4">
                  Konfigurasi Kuota Tiket (Regular & VIP)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Regular */}
                  <div className="p-4 bg-obsidian border border-silver-mist/15 space-y-3">
                    <span className="font-cinzel text-xs uppercase tracking-wider text-ivory block">
                      Tipe Tiket: Regular
                    </span>
                    <Input
                      label="Harga (Rp)"
                      type="number"
                      value={regularPrice}
                      onChange={(e) => setRegularPrice(Number(e.target.value))}
                      required
                    />
                    <Input
                      label="Total Kuota"
                      type="number"
                      value={regularQuota}
                      onChange={(e) => setRegularQuota(Number(e.target.value))}
                      required
                    />
                  </div>

                  {/* VIP */}
                  <div className="p-4 bg-obsidian border border-silver-mist/15 space-y-3">
                    <span className="font-cinzel text-xs uppercase tracking-wider text-dusk-rose block">
                      Tipe Tiket: VIP
                    </span>
                    <Input
                      label="Harga (Rp)"
                      type="number"
                      value={vipPrice}
                      onChange={(e) => setVipPrice(Number(e.target.value))}
                      required
                    />
                    <Input
                      label="Total Kuota"
                      type="number"
                      value={vipQuota}
                      onChange={(e) => setVipQuota(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  className="px-8"
                >
                  Publikasikan Event
                </Button>
              </div>
            </form>
          </div>

          {/* Tabel Daftar Event */}
          <div className="bg-charcoal border border-silver-mist/20 overflow-hidden">
            <div className="p-6 border-b border-silver-mist/15">
              <h3 className="font-cinzel text-base text-ivory tracking-wide">
                DAFTAR EVENT AKTIF
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-silver-mist font-inter">
                <thead className="bg-obsidian border-b border-silver-mist/15 font-cinzel text-[10px] uppercase tracking-wider text-silver-mist/60">
                  <tr>
                    <th className="py-3 px-4">Event</th>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Tipe Tiket</th>
                    <th className="py-3 px-4">Total Kuota</th>
                    <th className="py-3 px-4">Ditahan / Terjual</th>
                    <th className="py-3 px-4">Sisa Kuota</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-silver-mist/10">
                  {events.map((e) => (
                    <tr key={e.id} className="hover:bg-royal-plum/10 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-ivory max-w-xs truncate">
                        {e.title}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {new Date(e.startsAt || e.eventDate || Date.now()).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4">
                        {e.ticketTypes.map((t) => t.name).join(', ')}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {e.ticketTypes.reduce((s, t) => s + (t.quota || t.totalQuota || 0), 0)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-amber-300">
                        {e.ticketTypes.reduce((s, t) => s + (t.reservedCount ?? t.reservedQuota ?? 0), 0)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-dusk-rose">
                        {e.ticketTypes.reduce((s, t) => s + (t.remaining ?? t.remainingQuota ?? 0), 0)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={e.soldOut || e.isSoldOut ? 'SOLD_OUT' : 'VALID'} />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(e.id, e.title)}
                          disabled={deletingId === e.id}
                          className="px-2.5 py-1 text-[11px] font-cinzel text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-900/40 hover:border-red-700/60 transition-colors disabled:opacity-40"
                          title="Hapus event ini"
                        >
                          {deletingId === e.id ? 'Menghapus...' : 'Hapus'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Tabel Semua Pesanan */
        <div className="bg-charcoal border border-silver-mist/20 overflow-hidden">
          <div className="p-6 border-b border-silver-mist/15">
            <h3 className="font-cinzel text-base text-ivory tracking-wide">
              DAFTAR SELURUH PESANAN SISTEM
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-silver-mist font-inter">
              <thead className="bg-obsidian border-b border-silver-mist/15 font-cinzel text-[10px] uppercase tracking-wider text-silver-mist/60">
                <tr>
                  <th className="py-3 px-4">ID Pesanan</th>
                  <th className="py-3 px-4">Pembeli</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Jumlah Tiket</th>
                  <th className="py-3 px-4">Total Harga</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Waktu Dibuat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver-mist/10">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-royal-plum/10 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-silver-mist/60">
                      #{o.id.substring(0, 8)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-ivory">{o.user?.fullName}</div>
                      <div className="text-[11px] text-silver-mist/50">{o.user?.email}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-ivory">
                      {o.event?.title}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {o.items.reduce((s, i) => s + i.quantity, 0)} tiket
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-dusk-rose">
                      {formatRupiah(Number(o.totalAmount))}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-silver-mist/60">
                      {new Date(o.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
