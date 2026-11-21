import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/masuk');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-obsidian/95 backdrop-blur-sm border-b border-silver-mist/15">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo Utama: Blackletter UnifrakturCook */}
        <Link to="/" className="flex items-center space-x-2 text-left group">
          <span className="font-unifraktur text-2xl tracking-wider text-ivory group-hover:text-dusk-rose transition-colors">
            Gotix
          </span>
          <span className="text-[10px] uppercase font-cinzel tracking-[0.2em] text-silver-mist/60 hidden sm:inline">
            · Ticketing
          </span>
        </Link>

        {/* Navigasi Desktop */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link
            to="/events"
            className={`font-cinzel text-xs tracking-[0.18em] uppercase transition-colors ${
              isActive('/events')
                ? 'text-dusk-rose underline underline-offset-8 decoration-dusk-rose'
                : 'text-silver-mist/80 hover:text-ivory'
            }`}
          >
            Events
          </Link>

          {isAuthenticated && (
            <Link
              to="/tiket-saya"
              className={`font-cinzel text-xs tracking-[0.18em] uppercase transition-colors ${
                isActive('/tiket-saya')
                  ? 'text-dusk-rose underline underline-offset-8 decoration-dusk-rose'
                  : 'text-silver-mist/80 hover:text-ivory'
              }`}
            >
              Tiket Saya
            </Link>
          )}

          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              className={`font-cinzel text-xs tracking-[0.18em] uppercase transition-colors ${
                isActive('/admin')
                  ? 'text-dusk-rose underline underline-offset-8 decoration-dusk-rose'
                  : 'text-silver-mist/80 hover:text-ivory'
              }`}
            >
              Admin Dashboard
            </Link>
          )}
        </nav>

        {/* User Auth Section */}
        <div className="hidden md:flex items-center space-x-6">
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <span className="text-xs font-inter text-silver-mist/80">
                {user?.fullName?.split(' ')[0]}
              </span>
              <button
                onClick={handleLogout}
                className="font-cinzel text-xs tracking-[0.15em] uppercase text-silver-mist/60 hover:text-dusk-rose transition-colors"
              >
                Keluar
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                to="/masuk"
                className="font-cinzel text-xs tracking-[0.15em] uppercase text-silver-mist/80 hover:text-ivory transition-colors"
              >
                Masuk
              </Link>
              <Link
                to="/daftar"
                className="font-cinzel text-xs tracking-[0.15em] uppercase px-3 py-1.5 border border-silver-mist/30 text-ivory hover:border-dusk-rose hover:text-dusk-rose transition-colors"
              >
                Daftar
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-silver-mist p-2 focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-silver-mist/15 bg-obsidian px-6 py-6 space-y-4">
          <Link
            to="/events"
            onClick={() => setMobileMenuOpen(false)}
            className="block font-cinzel text-xs tracking-[0.2em] uppercase text-silver-mist hover:text-dusk-rose py-1"
          >
            Events
          </Link>
          {isAuthenticated && (
            <Link
              to="/tiket-saya"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-cinzel text-xs tracking-[0.2em] uppercase text-silver-mist hover:text-dusk-rose py-1"
            >
              Tiket Saya
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-cinzel text-xs tracking-[0.2em] uppercase text-silver-mist hover:text-dusk-rose py-1"
            >
              Admin Dashboard
            </Link>
          )}
          <div className="pt-4 border-t border-silver-mist/15 flex flex-col space-y-3">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="text-left font-cinzel text-xs tracking-[0.2em] uppercase text-dusk-rose"
              >
                Keluar ({user?.fullName})
              </button>
            ) : (
              <>
                <Link
                  to="/masuk"
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-cinzel text-xs tracking-[0.2em] uppercase text-silver-mist hover:text-ivory"
                >
                  Masuk
                </Link>
                <Link
                  to="/daftar"
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-cinzel text-xs tracking-[0.2em] uppercase text-dusk-rose"
                >
                  Daftar Akun Baru
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
