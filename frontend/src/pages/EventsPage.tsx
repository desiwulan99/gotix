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
    <div className="max-w-7xl mx-auto py-12 px-6 min-h-screen">
      <div className="border-b border-royal-plum/30 pb-8 mb-10">
        <h1 className="text-3xl font-black font-cinzel text-ivory-white tracking-wider">
          KATALOG EVENT
        </h1>
        <p className="text-xs text-silver-mist/70 mt-2">
          Pilih dan pesan tiket untuk pertunjukan neoklasik dan pengalaman gelap terbaik.
        </p>

        {/* Filters */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted-violet absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan judul atau lokasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-charcoal border border-royal-plum/60 rounded pl-10 pr-4 py-2 text-xs text-ivory-white placeholder-silver-mist/40 focus:outline-none focus:border-muted-violet"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filterStatus === 'ALL'
                  ? 'bg-royal-plum text-ivory-white'
                  : 'bg-charcoal text-silver-mist hover:text-ivory-white'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterStatus('AVAILABLE')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filterStatus === 'AVAILABLE'
                  ? 'bg-royal-plum text-ivory-white'
                  : 'bg-charcoal text-silver-mist hover:text-ivory-white'
              }`}
            >
              Tersedia
            </button>
            <button
              onClick={() => setFilterStatus('SOLDOUT')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                filterStatus === 'SOLDOUT'
                  ? 'bg-royal-plum text-ivory-white'
                  : 'bg-charcoal text-silver-mist hover:text-ivory-white'
              }`}
            >
              Sold Out
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-silver-mist text-sm">
          Memuat daftar event...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-20 bg-charcoal/40 rounded-lg border border-royal-plum/30">
          <p className="text-silver-mist text-sm">Tidak ada event yang sesuai kriteria.</p>
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
