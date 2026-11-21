import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-obsidian border-t border-silver-mist/15 py-12 px-4 sm:px-6 mt-20">
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center space-y-6">
        {/* Logo Gothic Simetris */}
        <Link to="/" className="group inline-block">
          <span className="font-unifraktur text-3xl tracking-widest text-ivory group-hover:text-dusk-rose transition-colors">
            Gotix
          </span>
        </Link>

        {/* Motto / Tagline */}
        <p className="font-cinzel text-xs tracking-[0.25em] uppercase text-silver-mist/70">
          Unlock the Unknown · Curated Nightfall Experiences
        </p>

        {/* Garis ornamen tengah */}
        <div className="flex items-center justify-center space-x-3 w-48">
          <div className="h-[1px] flex-1 bg-silver-mist/20" />
          <span className="text-[10px] text-dusk-rose">✦</span>
          <div className="h-[1px] flex-1 bg-silver-mist/20" />
        </div>

        {/* Tautan Navigasi Footer */}
        <nav className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 font-cinzel text-[11px] tracking-[0.2em] uppercase text-silver-mist/60">
          <Link to="/events" className="hover:text-ivory transition-colors">
            Events
          </Link>
          <Link to="/tiket-saya" className="hover:text-ivory transition-colors">
            Tiket Saya
          </Link>
          <Link to="/masuk" className="hover:text-ivory transition-colors">
            Masuk
          </Link>
          <Link to="/daftar" className="hover:text-ivory transition-colors">
            Daftar
          </Link>
        </nav>

        {/* Hak Cipta */}
        <div className="pt-4 text-[11px] font-inter text-silver-mist/40 tracking-wider">
          © {new Date().getFullYear()} GOTIX Ticketing System. Seluruh Hak Dilindungi.
        </div>
      </div>
    </footer>
  );
};
