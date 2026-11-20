import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Event } from '../types';
import { EventCard } from '../components/EventCard';
import { Search } from 'lucide-react';

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'AVAILABLE' | 'SOLDOUT'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events');
        setEvents(res.data.data);
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'AVAILABLE') return !e.isSoldOut;
    if (filterStatus === 'SOLDOUT') return e.isSoldOut;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 min-h-screen bg-ivory text-charcoal">
      <div className="border-b border-soft-gray pb-8 mb-10">
        <h1 className="text-3xl font-black font-cinzel text-charcoal tracking-wide">
          KATALOG EVENT
        </h1>
        <p className="text-xs text-muted-charcoal mt-1.5 font-light">
          Pilih dan pesan tiket untuk konser musik, seni, dan pengalaman eksklusif dengan kuota terbatas.
        </p>

        {/* Filters & Search */}
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-royal-mauve absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan judul atau lokasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-soft-gray rounded-xl pl-10 pr-4 py-2.5 text-xs text-charcoal placeholder-secondary/60 focus:outline-none focus:border-royal-mauve focus:ring-2 focus:ring-royal-mauve/10 shadow-sm transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                filterStatus === 'ALL'
                  ? 'bg-royal-mauve text-white shadow-sm'
                  : 'bg-white text-muted-charcoal hover:bg-soft-lavender/40 border border-soft-gray'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterStatus('AVAILABLE')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                filterStatus === 'AVAILABLE'
                  ? 'bg-royal-mauve text-white shadow-sm'
                  : 'bg-white text-muted-charcoal hover:bg-soft-lavender/40 border border-soft-gray'
              }`}
            >
              Tersedia
            </button>
            <button
              onClick={() => setFilterStatus('SOLDOUT')}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                filterStatus === 'SOLDOUT'
                  ? 'bg-royal-mauve text-white shadow-sm'
                  : 'bg-white text-muted-charcoal hover:bg-soft-lavender/40 border border-soft-gray'
              }`}
            >
              Sold Out
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-secondary text-xs">
          Memuat daftar event...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-soft-gray shadow-soft-card">
          <p className="text-muted-charcoal text-xs">Tidak ada event yang sesuai kriteria pencarian.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};
