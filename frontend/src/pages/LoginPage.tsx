import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, token } = res.data.data;
      login(token, user);
      navigate('/events');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login gagal, periksa email dan password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-charcoal border border-royal-plum/50 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <span className="text-2xl font-black font-cinzel tracking-widest text-ivory-white">
            GOTIX
          </span>
          <h2 className="text-sm font-bold font-cinzel text-silver-mist mt-2">
            MASUK KE AKUN ANDA
          </h2>
          <p className="text-xs text-silver-mist/60 mt-1">Unlock the Unknown.</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 rounded bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-silver-mist mb-1 font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full bg-obsidian border border-royal-plum/60 rounded px-3 py-2.5 text-ivory-white focus:outline-none focus:border-muted-violet"
            />
          </div>

          <div>
            <label className="block text-silver-mist mb-1 font-medium">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-obsidian border border-royal-plum/60 rounded px-3 py-2.5 text-ivory-white focus:outline-none focus:border-muted-violet"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded bg-royal-plum hover:bg-royal-plum/80 disabled:opacity-40 text-ivory-white text-xs font-bold uppercase tracking-widest transition-colors shadow-lg shadow-royal-plum/20 mt-2"
          >
            {isLoading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-silver-mist/60 border-t border-royal-plum/20 pt-4">
          Belum punya akun?{' '}
          <Link to="/register" className="text-muted-violet hover:text-ivory-white font-semibold">
            Daftar Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
};
