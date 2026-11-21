import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect target jika dialihkan dari rute terproteksi
  const params = new URLSearchParams(location.search);
  const redirectPath = params.get('redirect') || '/events';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, token } = res.data.data;
      login(token, user);
      navigate(redirectPath);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login gagal, periksa email dan password Anda');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-obsidian text-ivory">
      <div className="w-full max-w-md bg-charcoal border border-silver-mist/20 p-8 sm:p-10 relative text-left">
        {/* Ornamen ganda sudut */}
        <div className="absolute top-2 left-2 text-[8px] text-dusk-rose select-none">✦</div>
        <div className="absolute top-2 right-2 text-[8px] text-dusk-rose select-none">✦</div>
        <div className="absolute bottom-2 left-2 text-[8px] text-dusk-rose select-none">✦</div>
        <div className="absolute bottom-2 right-2 text-[8px] text-dusk-rose select-none">✦</div>

        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="font-unifraktur text-3xl tracking-widest text-ivory">
              Gotix
            </span>
          </Link>
          <h2 className="text-xs font-cinzel tracking-[0.2em] uppercase text-silver-mist/80 mt-2">
            MASUK KE AKUN ANDA
          </h2>
          <p className="text-[11px] font-cormorant italic text-silver-mist/60 mt-1">
            Unlock the Unknown.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-royal-plum/40 border border-red-500/60 text-red-200 text-xs font-inter">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Alamat Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
          />

          <Input
            label="Kata Sandi"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full py-3"
              isLoading={isLoading}
            >
              Masuk Sekarang
            </Button>
          </div>
        </form>

        <div className="mt-8 text-center text-xs font-inter text-silver-mist/60 border-t border-silver-mist/15 pt-5">
          Belum memiliki akun?{' '}
          <Link to="/daftar" className="font-cinzel text-dusk-rose hover:underline underline-offset-4 tracking-wider">
            Daftar di sini
          </Link>
        </div>
      </div>
    </div>
  );
};
