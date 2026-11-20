import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-charcoal border-t border-royal-plum/30 py-12 px-6 mt-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div>
          <span className="text-xl font-bold font-cinzel tracking-widest text-ivory-white">
            GOTIX
          </span>
          <p className="text-xs text-silver-mist/70 tracking-widest mt-1">
            Unlock the Unknown. Subtle Gothic Luxury Ticketing Platform.
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs text-silver-mist">
          <Link to="/" className="hover:text-ivory-white transition-colors">
            Beranda
          </Link>
          <Link to="/events" className="hover:text-ivory-white transition-colors">
            Katalog Event
          </Link>
          <Link to="/my-tickets" className="hover:text-ivory-white transition-colors">
            Tiket Saya
          </Link>
        </div>

        <div className="text-xs text-silver-mist/50">
          &copy; {new Date().getFullYear()} GOTIX. Final Project Back-End Intermediate.
        </div>
      </div>
    </footer>
  );
};
