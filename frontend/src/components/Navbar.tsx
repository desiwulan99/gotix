import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Ticket, LogOut, ShieldCheck, User as UserIcon, Compass } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-ivory/85 backdrop-blur-md border-b border-soft-gray/80 px-6 py-4 transition-all duration-300">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo GOTIX */}
        <Link to="/" className="flex items-center gap-3 group">
          <span className="text-2xl font-black font-cinzel tracking-widest text-charcoal group-hover:text-plum transition-colors">
            GOTIX
          </span>
          <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest text-secondary border-l border-soft-gray pl-3 font-medium">
            Soft Gothic Luxury
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-7">
          <Link
            to="/events"
            className={`text-xs uppercase tracking-wider font-medium transition-colors ${
              isActive('/events')
                ? 'text-plum font-semibold'
                : 'text-muted-charcoal hover:text-charcoal'
            }`}
          >
            Katalog Event
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <Link
                to="/my-tickets"
                className={`flex items-center gap-1.5 text-xs uppercase tracking-wider font-medium transition-colors ${
                  isActive('/my-tickets')
                    ? 'text-plum font-semibold'
                    : 'text-muted-charcoal hover:text-charcoal'
                }`}
              >
                <Ticket className="w-3.5 h-3.5 text-royal-mauve" />
                <span>Tiket Saya</span>
              </Link>

              {user.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-soft-lavender border border-dusty-purple/40 text-xs font-semibold text-plum hover:bg-soft-lavender/80 transition-all"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-plum" />
                  <span>Admin</span>
                </Link>
              )}

              <div className="flex items-center gap-2 pl-3 border-l border-soft-gray">
                <span className="text-xs text-muted-charcoal hidden md:inline-block font-medium">
                  {user.fullName}
                </span>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-1.5 rounded-full hover:bg-soft-lavender text-secondary hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="flex items-center gap-1 text-xs uppercase tracking-wider font-medium text-muted-charcoal hover:text-charcoal px-3 py-1.5 rounded-lg hover:bg-soft-lavender/50 transition-colors"
              >
                <UserIcon className="w-3.5 h-3.5 text-royal-mauve" />
                <span>Masuk</span>
              </Link>
              <Link
                to="/register"
                className="text-xs uppercase tracking-wider font-semibold px-4 py-2 rounded-xl bg-royal-mauve hover:bg-plum text-white transition-all shadow-sm hover:shadow"
              >
                Daftar
              </Link>
            </div>
          )}

          <Link
            to="/events"
            className="hidden lg:flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl bg-white border border-soft-gray hover:border-dusty-purple text-charcoal hover:text-plum shadow-sm transition-all"
          >
            <Compass className="w-3.5 h-3.5 text-royal-mauve" />
            <span>Jelajahi Sekarang</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};
