import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  let label = status;
  let colorStyles = 'bg-charcoal border-silver-mist/30 text-silver-mist';

  switch (status.toUpperCase()) {
    case 'PENDING_PAYMENT':
      label = 'MENUNGGU PEMBAYARAN';
      colorStyles = 'bg-charcoal border-amber-500/50 text-amber-300';
      break;
    case 'PAID':
    case 'SUCCESS':
    case 'VALID':
      label = 'LUNAS / SAH';
      colorStyles = 'bg-charcoal border-emerald-500/50 text-emerald-300';
      break;
    case 'CANCELLED':
      label = 'DIBATALKAN';
      colorStyles = 'bg-charcoal border-zinc-600 text-zinc-400';
      break;
    case 'EXPIRED':
      label = 'KEDALUWARSA';
      colorStyles = 'bg-charcoal border-red-500/40 text-red-300';
      break;
    case 'USED':
      label = 'TERPAKAI';
      colorStyles = 'bg-charcoal border-silver-mist/30 text-silver-mist';
      break;
    case 'SOLD_OUT':
      label = 'HABIS TERJUAL';
      colorStyles = 'bg-charcoal border-red-900/60 text-dusk-rose';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-cinzel tracking-[0.15em] uppercase border ${colorStyles} ${className}`}
    >
      {label}
    </span>
  );
};
