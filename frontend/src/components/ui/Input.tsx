import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || props.name || Math.random().toString(36).substring(2, 9);

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs uppercase tracking-[0.15em] font-cinzel text-silver-mist/80"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3.5 py-2.5 bg-obsidian border border-silver-mist/20 text-ivory placeholder-silver-mist/40 text-sm font-inter transition-all duration-200 focus:outline-none focus:border-dusk-rose focus:ring-1 focus:ring-dusk-rose/30 disabled:opacity-40 disabled:bg-charcoal/40 ${
          error ? 'border-red-500/80 focus:border-red-500' : ''
        } ${className}`}
        {...props}
      />
      {hint && !error && <p className="text-[11px] text-silver-mist/60 font-inter">{hint}</p>}
      {error && <p className="text-[11px] text-red-400 font-inter">{error}</p>}
    </div>
  );
};
