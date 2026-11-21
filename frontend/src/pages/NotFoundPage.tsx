import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-3xl text-dusk-rose select-none mb-3">✦</div>
      <h1 className="font-cinzel text-5xl sm:text-6xl text-ivory tracking-[0.1em] mb-3">
        404
      </h1>
      <h2 className="font-cinzel text-base uppercase tracking-[0.2em] text-silver-mist mb-6">
        Halaman Tidak Ditemukan
      </h2>
      <p className="font-cormorant italic text-sm text-silver-mist/70 max-w-sm mb-8">
        Jalan setapak yang Anda tuju telah tertutup oleh bayang-bayang malam.
      </p>
      <Link
        to="/"
        className="font-cinzel text-xs tracking-[0.25em] uppercase text-ivory hover:text-dusk-rose underline underline-offset-8 decoration-dusk-rose transition-colors"
      >
        KEMBALI KE BERANDA
      </Link>
    </div>
  );
};
