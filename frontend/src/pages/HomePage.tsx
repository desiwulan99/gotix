import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Event } from '../types';
import { EventCard } from '../components/EventCard';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { SectionDivider } from '../components/SectionDivider';

export const HomePage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('SEMUA');

  const categories = ['SEMUA', 'KONSER & MUSIK', 'TEATER & SENI', 'ORCHESTRA', 'EXHIBITION'];

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events');
        // Backend returns { success: true, data: [...] }
        const data = Array.isArray(res.data.data) ? res.data.data : [];
        setEvents(data);
      } catch (err) {
        console.error('Gagal memuat event:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((e) => {
    const matchSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase());
    if (selectedCategory === 'SEMUA') return matchSearch;
    return matchSearch; // Sederhana
  });

  return (
    <div className="min-h-screen bg-obsidian text-ivory">
      {/* 1. Cinematic Hero Layar Penuh dengan Sorotan Hangat Halus */}
      <section className="relative min-h-[85vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 overflow-hidden border-b border-silver-mist/15">
        {/* Radial Warm Glow Terinspirasi Soul Cards */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 40%, rgba(57, 37, 68, 0.45) 0%, rgba(25, 21, 29, 0.8) 50%, #0D0B10 100%)',
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center space-y-6 pt-12 pb-16">
          {/* Label Huruf Kapital Kecil Ber-Letter-Spacing Lebar */}
          <div className="text-[11px] font-cinzel tracking-[0.3em] uppercase text-dusk-rose select-none">
            ✦ RITUALS OF SOUND & SHADOW ✦
          </div>

          {/* Judul Serif Besar Tipis */}
          <h1 className="font-cinzel text-4xl sm:text-6xl font-normal tracking-[0.06em] text-ivory leading-tight max-w-2xl">
            UNLOCK THE UNKNOWN.
          </h1>

          {/* Subjudul Cormorant Italic */}
          <p className="font-cormorant italic text-lg sm:text-xl text-silver-mist max-w-xl mx-auto leading-relaxed">
            Eksplorasi kurasi pengalaman malam neoklasik, konser katedral kuno, dan pertunjukan seni gotik berkuota terbatas.
          </p>

          {/* Kotak Pencarian Minimalis Dark */}
          <div className="w-full max-w-md pt-4">
            <div className="flex items-center border border-silver-mist/30 bg-charcoal/80 focus-within:border-dusk-rose transition-colors p-1">
              <input
                type="text"
                placeholder="Cari event, konser, atau kota..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent px-4 py-2.5 text-xs text-ivory placeholder-silver-mist/40 focus:outline-none font-inter"
              />
              <Link
                to="/events"
                className="px-5 py-2.5 font-cinzel text-[11px] tracking-[0.15em] uppercase text-ivory bg-royal-plum hover:bg-dusk-rose hover:text-obsidian transition-colors shrink-0"
              >
                Cari
              </Link>
            </div>
          </div>

          {/* Tombol Teks Garis Bawah Tipis Khas Soul Cards */}
          <div className="pt-4 flex items-center space-x-8">
            <Link
              to="/events"
              className="font-cinzel text-xs tracking-[0.25em] uppercase text-ivory hover:text-dusk-rose underline underline-offset-8 decoration-dusk-rose transition-colors"
            >
              JELAJAHI EVENT
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Dua Panel Hero Berdampingan dengan Garis Vertikal Tipis di Tengah */}
      <section className="border-b border-silver-mist/15 bg-charcoal">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-silver-mist/15">
          {/* Panel Kiri: Konser & Musik */}
          <Link
            to="/events"
            className="group p-10 sm:p-16 flex flex-col justify-center items-center text-center hover:bg-royal-plum/20 transition-all duration-300 relative overflow-hidden"
          >
            <span className="text-[10px] font-cinzel tracking-[0.25em] uppercase text-silver-mist/60 mb-2">
              BAGIAN I · INTENSI
            </span>
            <h2 className="font-cinzel text-2xl sm:text-3xl tracking-[0.08em] text-ivory group-hover:text-dusk-rose transition-colors">
              KONSER & MUSIK
            </h2>
            <p className="font-cormorant italic text-sm text-silver-mist mt-2 max-w-xs">
              Simfoni gelap neoklasik, darkwave industrial, dan paduan suara katedral.
            </p>
            <span className="mt-6 font-cinzel text-[11px] tracking-[0.2em] uppercase text-silver-mist/80 group-hover:text-dusk-rose underline underline-offset-8 decoration-silver-mist/30 group-hover:decoration-dusk-rose transition-all">
              LIHAT JADWAL →
            </span>
          </Link>

          {/* Panel Kanan: Teater & Seni */}
          <Link
            to="/events"
            className="group p-10 sm:p-16 flex flex-col justify-center items-center text-center hover:bg-royal-plum/20 transition-all duration-300 relative overflow-hidden"
          >
            <span className="text-[10px] font-cinzel tracking-[0.25em] uppercase text-silver-mist/60 mb-2">
              BAGIAN II · ENIGMA
            </span>
            <h2 className="font-cinzel text-2xl sm:text-3xl tracking-[0.08em] text-ivory group-hover:text-dusk-rose transition-colors">
              TEATER & SENI
            </h2>
            <p className="font-cormorant italic text-sm text-silver-mist mt-2 max-w-xs">
              Pesta topeng victorian, pertunjukan visual mistis, dan instalasi lilin obsidian.
            </p>
            <span className="mt-6 font-cinzel text-[11px] tracking-[0.2em] uppercase text-silver-mist/80 group-hover:text-dusk-rose underline underline-offset-8 decoration-silver-mist/30 group-hover:decoration-dusk-rose transition-all">
              JELAJAHI RUANG →
            </span>
          </Link>
        </div>
      </section>

      {/* 3. Blok Kutipan Terpusat ("Our Story") */}
      <section className="py-20 px-4 sm:px-6 max-w-3xl mx-auto text-center">
        <span className="text-3xl text-dusk-rose font-cinzel select-none">“</span>
        <blockquote className="font-cormorant italic text-xl sm:text-2xl text-ivory leading-relaxed mt-2 mb-4">
          Kami percaya keindahan sejati bermula saat cahaya meredup. GOTIX bukan sekadar gerbang tiket,
          melainkan paspor kuratorial menuju pengalaman malam yang tak tertandingi.
        </blockquote>
        <div className="font-cinzel text-xs tracking-[0.25em] uppercase text-silver-mist/60 mb-4">
          — OUR STORY · GOTIX MANIFESTO
        </div>
        <SectionDivider />
      </section>

      {/* 4. Filter Kategori Huruf Kapital Kecil Ber-Letter-Spacing Lebar Tanpa Ikon */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-12">
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 border-y border-silver-mist/15 py-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`font-cinzel text-xs tracking-[0.2em] uppercase transition-all py-1 ${
                selectedCategory === cat
                  ? 'text-dusk-rose underline underline-offset-8 decoration-dusk-rose'
                  : 'text-silver-mist/60 hover:text-ivory'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* 5. Grid Kartu Bergaya Tarot untuk Event Pilihan */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-[10px] font-cinzel tracking-[0.25em] uppercase text-dusk-rose block mb-1">
              KURASI UNGGULAN
            </span>
            <h2 className="font-cinzel text-2xl tracking-[0.06em] text-ivory">
              EVENT TERBARU
            </h2>
          </div>
          <Link
            to="/events"
            className="font-cinzel text-xs tracking-[0.18em] uppercase text-silver-mist hover:text-dusk-rose underline underline-offset-6 transition-colors"
          >
            LIHAT SEMUA ({events.length})
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <SkeletonLoader count={3} className="aspect-[2/3] w-full" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-16 text-center border border-silver-mist/10 bg-charcoal/30">
            <span className="text-xl text-dusk-rose select-none">✦</span>
            <p className="font-cinzel text-sm tracking-[0.1em] text-silver-mist mt-3">
              Belum ada event yang cocok dengan kriteria pencarian.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {filteredEvents.slice(0, 6).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
