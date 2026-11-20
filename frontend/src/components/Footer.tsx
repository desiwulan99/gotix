import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-pearl border-t border-soft-gray/80 py-14 px-6 mt-24">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div>
          <span className="text-xl font-bold font-cinzel tracking-widest text-charcoal">
            GOTIX
          </span>
          <p className="text-xs text-secondary mt-1.5 font-light tracking-wide max-w-sm">
            Discover the Extraordinary. Soft Gothic Luxury Ticketing System dengan proteksi kuota anti-overselling.
          </p>
        </div>

        <div className="flex items-center gap-8 text-xs font-medium text-muted-charcoal">
          <Link to="/" className="hover:text-plum transition-colors">
            Beranda
          </Link>
          <Link to="/events" className="hover:text-plum transition-colors">
            Katalog Event
          </Link>
          <Link to="/my-tickets" className="hover:text-plum transition-colors">
            Tiket Saya
          </Link>
          <Link to="/admin" className="hover:text-plum transition-colors">
            Admin
          </Link>
        </div>

        <div className="text-xs text-secondary font-light">
          &copy; {new Date().getFullYear()} GOTIX. Final Project Back-End Intermediate.
        </div>
      </div>
    </footer>
  );
};
