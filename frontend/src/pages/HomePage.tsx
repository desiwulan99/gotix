import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Event } from '../types';
import { EventCard } from '../components/EventCard';
import { Search, Compass, Shield, Sparkles, Music, Palette, Tent, Users, BookOpen } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [isLoading, setIsLoading] = useState(true);

  const categories = [
    { name: 'Semua', icon: Compass },
    { name: 'Musik', icon: Music },
    { name: 'Seni & Budaya', icon: Palette },
    { name: 'Festival', icon: Tent },
    { name: 'Komunitas', icon: Users },
    { name: 'Workshop', icon: BookOpen },
  ];

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
    <div className="min-h-screen bg-ivory text-charcoal">
      {/* Hero Section */}
      <section className="relative py-24 sm:py-32 px-6 overflow-hidden bg-gradient-to-b from-pearl via-ivory to-ivory border-b border-soft-gray/60">
        {/* Subtle Gothic Arch Background Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] border border-dusty-purple/20 rounded-b-[350px] pointer-events-none opacity-40"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[550px] h-[275px] border border-royal-mauve/15 rounded-b-[275px] pointer-events-none opacity-30"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-soft-lavender/80 border border-dusty-purple/40 text-plum text-[11px] font-semibold tracking-widest uppercase mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-royal-mauve" />
            <span>Soft Gothic Luxury Ticketing</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black font-cinzel tracking-wide text-charcoal mb-6 leading-tight">
            DISCOVER THE EXTRAORDINARY.
          </h1>

          <p className="text-sm sm:text-base text-muted-charcoal max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Find your next experience, explore unforgettable events, and secure your place with GOTIX.
          </p>

          {/* Search Box */}
          <div className="max-w-xl mx-auto relative flex items-center bg-white border border-soft-gray focus-within:border-royal-mauve rounded-2xl overflow-hidden shadow-soft-card focus-within:shadow-soft-hover transition-all duration-300">
            <Search className="w-4 h-4 text-royal-mauve ml-4 shrink-0" />
            <input
              type="text"
              placeholder="Cari event, konser, atau kota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent px-4 py-3.5 text-xs sm:text-sm text-charcoal placeholder-secondary/60 focus:outline-none"
            />
            <Link
              to="/events"
              className="px-6 py-3.5 bg-royal-mauve hover:bg-plum text-white text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 m-1 rounded-xl"
            >
              Cari
            </Link>
          </div>

          {/* Quick CTA Buttons */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              to="/events"
              className="px-6 py-3 rounded-xl bg-royal-mauve hover:bg-plum text-white text-xs font-semibold uppercase tracking-wider shadow-sm transition-all"
            >
              Jelajahi Event
            </Link>
            <a
              href="#featured-section"
              className="px-6 py-3 rounded-xl bg-white hover:bg-soft-lavender/40 border border-soft-gray text-muted-charcoal hover:text-charcoal text-xs font-semibold uppercase tracking-wider transition-all"
            >
              Pelajari Lebih Lanjut
            </a>
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      <section className="py-8 border-b border-soft-gray/50 px-6 bg-white/60">
        <div className="max-w-6xl mx-auto flex items-center justify-center flex-wrap gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-royal-mauve text-white shadow-sm'
                    : 'bg-pearl text-muted-charcoal hover:bg-soft-lavender/60 border border-soft-gray/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-royal-mauve'}`} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Value Proposition Highlights */}
      <section className="py-14 border-b border-soft-gray/40 px-6 bg-pearl/40">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-soft-gray shadow-soft-card">
            <div className="p-2.5 rounded-xl bg-soft-lavender text-plum">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold font-cinzel text-charcoal">100% Anti-Overselling</h4>
              <p className="text-xs text-muted-charcoal mt-1 font-light leading-relaxed">
                Penguncian konkurensi tingkat database (Row-Level Locking) menjamin kuota tidak pernah terjual melebihi kapasitas fisik.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-soft-gray shadow-soft-card">
            <div className="p-2.5 rounded-xl bg-soft-lavender text-plum">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold font-cinzel text-charcoal">Reservasi Aman 15 Menit</h4>
              <p className="text-xs text-muted-charcoal mt-1 font-light leading-relaxed">
                Tiket ditahan eksklusif untuk Anda selama 15 menit agar Anda dapat menyelesaikan proses pembayaran dengan tenang.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-soft-gray shadow-soft-card">
            <div className="p-2.5 rounded-xl bg-soft-lavender text-plum">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold font-cinzel text-charcoal">Tiket Kriptografis Unik</h4>
              <p className="text-xs text-muted-charcoal mt-1 font-light leading-relaxed">
                Setiap tiket memiliki kode unik yang tidak dapat dipalsukan dan dijamin idempoten terhadap duplikasi pembayaran.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section id="featured-section" className="max-w-6xl mx-auto py-16 px-6">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-bold font-cinzel text-charcoal">Event Unggulan</h2>
            <p className="text-xs text-secondary mt-1 font-light">Eksplorasi pengalaman eksklusif mendatang</p>
          </div>
          <Link
            to="/events"
            className="text-xs font-semibold tracking-wider text-royal-mauve hover:text-plum uppercase transition-colors"
          >
            Lihat Semua Event &rarr;
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-secondary text-xs">
            Memuat daftar event...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-soft-gray shadow-soft-card">
            <p className="text-muted-charcoal text-xs">Tidak ada event yang sesuai pencarian.</p>
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
