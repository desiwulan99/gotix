import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Event } from '../types';
import { EventCard } from '../components/EventCard';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'AVAILABLE' | 'SOLDOUT'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('SEMUA');
  const [isLoading, setIsLoading] = useState(true);

  const categories = ['SEMUA', 'KONSER & MUSIK', 'TEATER & SENI', 'ORCHESTRA', 'EXHIBITION'];

  const getEventCategory = (e: Event): string => {
    const text = `${e.title} ${e.description}`.toLowerCase();
    if (text.includes('orchestra') || text.includes('symphony') || text.includes('orkestra')) return 'ORCHESTRA';
    if (text.includes('masquerade') || text.includes('teater') || text.includes('drama')) return 'TEATER & SENI';
    if (text.includes('electronic') || text.includes('gathering') || text.includes('konser')) return 'KONSER & MUSIK';
    if (text.includes('canvas') || text.includes('sculpture') || text.includes('exhibition') || text.includes('pameran')) return 'EXHIBITION';
    return 'KONSER & MUSIK';
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events');
        const data = Array.isArray(res.data.data) ? res.data.data : [];
        setEvents(data);
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

    if (selectedCategory !== 'SEMUA' && getEventCategory(e) !== selectedCategory) {
      return false;
    }

    const isSoldOut = e.soldOut || e.isSoldOut;
    if (filterStatus === 'AVAILABLE') return !isSoldOut;
    if (filterStatus === 'SOLDOUT') return isSoldOut;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 min-h-screen bg-obsidian text-ivory">
      {/* Header Halaman */}
      <div className="border-b border-silver-mist/15 pb-8 mb-10 text-left">
        <span className="text-[10px] uppercase tracking-[0.25em] text-dusk-rose font-cinzel">
          ✦ RITUAL & JADWAL MALAM ✦
        </span>
        <h1 className="text-3xl sm:text-4xl font-normal font-cinzel text-ivory tracking-[0.06em] mt-1">
          DAFTAR EVENT
        </h1>
        <p className="text-xs sm:text-sm text-silver-mist/70 mt-2 font-inter max-w-2xl">
          Eksplorasi konser musik neoklasik, festival, dan pameran seni dengan jaminan alokasi kuota anti-overselling.
        </p>

        {/* Toolbar Pencarian & Filter Kategori */}
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
          {/* Input Pencarian Minimalis */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Cari berdasarkan judul atau kota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-charcoal border border-silver-mist/20 px-4 py-2.5 text-xs text-ivory placeholder-silver-mist/40 focus:outline-none focus:border-dusk-rose transition-colors font-inter"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-silver-mist/60 hover:text-ivory text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Status: Tautan Huruf Kapital Kecil Khas Soul Cards */}
          <div className="flex items-center space-x-6 sm:space-x-8">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`font-cinzel text-xs tracking-[0.2em] uppercase py-1 transition-all ${
                filterStatus === 'ALL'
                  ? 'text-dusk-rose underline underline-offset-8 decoration-dusk-rose'
                  : 'text-silver-mist/60 hover:text-ivory'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterStatus('AVAILABLE')}
              className={`font-cinzel text-xs tracking-[0.2em] uppercase py-1 transition-all ${
                filterStatus === 'AVAILABLE'
                  ? 'text-dusk-rose underline underline-offset-8 decoration-dusk-rose'
                  : 'text-silver-mist/60 hover:text-ivory'
              }`}
            >
              Tersedia
            </button>
            <button
              onClick={() => setFilterStatus('SOLDOUT')}
              className={`font-cinzel text-xs tracking-[0.2em] uppercase py-1 transition-all ${
                filterStatus === 'SOLDOUT'
                  ? 'text-dusk-rose underline underline-offset-8 decoration-dusk-rose'
                  : 'text-silver-mist/60 hover:text-ivory'
              }`}
            >
              Habis
            </button>
          </div>
        </div>

        {/* Kategori Pertunjukan */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-8 pt-4 border-t border-silver-mist/10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`font-cinzel text-xs tracking-[0.15em] uppercase py-1 transition-all ${
                selectedCategory === cat
                  ? 'text-dusk-rose underline underline-offset-8 decoration-dusk-rose'
                  : 'text-silver-mist/60 hover:text-ivory'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Kartu Tarot Event */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          <SkeletonLoader count={6} className="aspect-[2/3] w-full" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          title="Tidak Ada Event yang Ditemukan"
          description="Coba ubah kata kunci pencarian atau ganti filter status untuk melihat event lain."
          actionText="TAMPILKAN SEMUA EVENT"
          onAction={() => {
            setSearch('');
            setFilterStatus('ALL');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};
