import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Event } from '../types';
import { EventCard } from '../components/EventCard';
import { Search, Compass, Shield, Sparkles } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState('');
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

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 px-6 overflow-hidden bg-gothic-radial border-b border-royal-plum/30">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-plum/40 border border-muted-violet/40 text-silver-mist text-xs tracking-widest uppercase mb-6 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-muted-violet" />
            <span>Subtle Gothic Luxury Ticketing</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black font-cinzel tracking-wider text-ivory-white mb-6 leading-tight">
            UNLOCK THE UNKNOWN.
          </h1>

          <p className="text-sm sm:text-base text-silver-mist/80 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Eksplorasi konser orkestra neoklasik gelap, pesta topeng misterius, dan festival atmosferik dengan kuota terbatas dan jaminan sistem pemesanan anti-overselling.
          </p>

          {/* Search Box */}
          <div className="max-w-xl mx-auto relative flex items-center bg-charcoal/90 border border-royal-plum/60 focus-within:border-muted-violet rounded-lg overflow-hidden shadow-2xl backdrop-blur-md">
            <Search className="w-5 h-5 text-muted-violet ml-4 shrink-0" />
            <input
              type="text"
              placeholder="Cari event atau kota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent px-4 py-3.5 text-sm text-ivory-white placeholder-silver-mist/40 focus:outline-none"
            />
            <Link
              to="/events"
              className="px-6 py-3.5 bg-royal-plum hover:bg-royal-plum/80 text-ivory-white text-xs font-semibold uppercase tracking-wider transition-colors shrink-0"
            >
              Cari
            </Link>
          </div>
        </div>
      </section>

      {/* Value Proposition Highlights */}
      <section className="py-12 border-b border-royal-plum/20 px-6 bg-charcoal/40">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4 p-4 rounded border border-royal-plum/20 bg-charcoal/50">
            <Shield className="w-8 h-8 text-muted-violet shrink-0 mt-1" />
            <div>
              <h4 className="text-sm font-bold font-cinzel text-ivory-white">100% Anti-Overselling</h4>
              <p className="text-xs text-silver-mist/70 mt-1">
                Kunci konkurensi tingkat database (Row-Level Locking) menjamin kuota tidak pernah terjual melebihi kapasitas.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded border border-royal-plum/20 bg-charcoal/50">
            <Compass className="w-8 h-8 text-muted-violet shrink-0 mt-1" />
            <div>
              <h4 className="text-sm font-bold font-cinzel text-ivory-white">Reservasi Aman 15 Menit</h4>
              <p className="text-xs text-silver-mist/70 mt-1">
                Tiket ditahan eksklusif untuk Anda selama 15 menit agar Anda dapat menyelesaikan pembayaran dengan tenang.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded border border-royal-plum/20 bg-charcoal/50">
            <Sparkles className="w-8 h-8 text-muted-violet shrink-0 mt-1" />
            <div>
              <h4 className="text-sm font-bold font-cinzel text-ivory-white">Tiket Unik Kriptografis</h4>
              <p className="text-xs text-silver-mist/70 mt-1">
                Setiap tiket memiliki kode unik yang tidak dapat dipalsukan dan dijamin idempoten terhadap duplikasi pembayaran.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="max-w-7xl mx-auto py-16 px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold font-cinzel text-ivory-white">Event Unggulan</h2>
            <p className="text-xs text-silver-mist/60 mt-1">Eksplorasi pengalaman eksklusif mendatang</p>
          </div>
          <Link
            to="/events"
            className="text-xs font-semibold tracking-wider text-muted-violet hover:text-silver-mist uppercase transition-colors"
          >
            Lihat Semua Event &rarr;
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-silver-mist/60 text-sm">
            Memuat daftar event...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 bg-charcoal/40 rounded-lg border border-royal-plum/30">
            <p className="text-silver-mist text-sm">Tidak ada event yang sesuai pencarian.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.slice(0, 6).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
