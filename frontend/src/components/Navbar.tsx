import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Ticket, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-obsidian/90 backdrop-blur-md border-b border-royal-plum/40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo GOTIX */}
        <Link to="/" className="flex items-center gap-3 group">
          <span className="text-2xl font-black font-cinzel tracking-widest text-ivory-white group-hover:text-muted-violet transition-colors">
            GOTIX
          </span>
          <span className="hidden md:inline-block text-xs uppercase tracking-widest text-silver-mist/60 border-l border-royal-plum/60 pl-3">
            Unlock the Unknown
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          <Link
            to="/events"
            className="text-silver-mist hover:text-ivory-white text-sm font-medium tracking-wide transition-colors"
          >
            Katalog Event
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <Link
                to="/my-tickets"
                className="flex items-center gap-2 text-silver-mist hover:text-ivory-white text-sm font-medium transition-colors"
              >
                <Ticket className="w-4 h-4 text-muted-violet" />
                <span>Tiket Saya</span>
              </Link>

              {user.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-royal-plum/40 border border-royal-plum hover:bg-royal-plum/60 text-xs font-semibold text-silver-mist hover:text-ivory-white transition-all"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-muted-violet" />
                  <span>Admin</span>
                </Link>
              )}

              <div className="flex items-center gap-2 pl-2 border-l border-royal-plum/50">
                <span className="text-xs text-silver-mist/80 hidden sm:inline-block">
                  {user.fullName}
                </span>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-1.5 rounded-full hover:bg-charcoal text-silver-mist hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-sm font-medium text-silver-mist hover:text-ivory-white px-3 py-1.5 rounded hover:bg-charcoal transition-colors"
              >
                <UserIcon className="w-4 h-4" />
                <span>Masuk</span>
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium px-4 py-2 rounded bg-royal-plum hover:bg-royal-plum/80 text-ivory-white transition-colors border border-muted-violet/30 shadow-lg shadow-royal-plum/20"
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
