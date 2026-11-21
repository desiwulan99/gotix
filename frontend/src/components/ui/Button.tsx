import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'underline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-cinzel tracking-[0.15em] uppercase text-xs transition-all duration-300 select-none disabled:opacity-40 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'px-4 py-2 min-h-[36px]',
    md: 'px-6 py-2.5 min-h-[42px]',
    lg: 'px-8 py-3.5 min-h-[48px] text-sm',
  };

  const variantStyles = {
    // Tombol utama: Obsidian dengan border tipis Silver Mist / Muted Violet dan hover Royal Plum
    primary:
      'bg-charcoal border border-silver-mist/30 text-ivory hover:border-dusk-rose hover:bg-royal-plum hover:text-ivory shadow-gothic-card',
    // Tombol outline: Border tipis tanpa background
    outline:
      'border border-silver-mist/40 text-silver-mist hover:text-ivory hover:border-dusk-rose hover:bg-charcoal/50',
    // Tombol teks bergaris bawah tipis khas Soul Cards
    underline:
      'bg-transparent text-silver-mist hover:text-dusk-rose underline underline-offset-8 decoration-silver-mist/40 hover:decoration-dusk-rose px-0 py-1 min-h-[36px]',
    // Danger untuk pembatalan
    danger:
      'bg-charcoal border border-red-900/60 text-red-300 hover:bg-red-950/40 hover:border-red-700',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center space-x-2">
          <svg className="animate-spin h-3.5 w-3.5 text-dusk-rose" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Memproses...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
