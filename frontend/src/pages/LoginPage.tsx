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
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12 bg-ivory text-charcoal">
      <div className="w-full max-w-md bg-white border border-soft-gray rounded-3xl p-8 sm:p-10 shadow-soft-card">
        <div className="text-center mb-8">
          <span className="text-2xl font-black font-cinzel tracking-widest text-charcoal">
            GOTIX
          </span>
          <h2 className="text-sm font-bold font-cinzel text-muted-charcoal mt-2">
            MASUK KE AKUN ANDA
          </h2>
          <p className="text-xs text-secondary mt-1 font-light">Discover the Extraordinary.</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-muted-charcoal mb-1.5 font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full bg-pearl border border-soft-gray rounded-xl px-4 py-3 text-charcoal placeholder-secondary/60 focus:outline-none focus:border-royal-mauve focus:bg-white transition-all shadow-xs"
            />
          </div>

          <div>
            <label className="block text-muted-charcoal mb-1.5 font-medium">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-pearl border border-soft-gray rounded-xl px-4 py-3 text-charcoal placeholder-secondary/60 focus:outline-none focus:border-royal-mauve focus:bg-white transition-all shadow-xs"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-royal-mauve hover:bg-plum disabled:opacity-40 text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-sm hover:shadow mt-3"
          >
            {isLoading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-secondary border-t border-soft-gray/60 pt-5 font-light">
          Belum punya akun?{' '}
          <Link to="/register" className="text-plum hover:text-charcoal font-semibold">
            Daftar Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
};
