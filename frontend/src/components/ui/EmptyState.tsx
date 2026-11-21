import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="w-full py-16 px-4 text-center flex flex-col items-center justify-center border border-silver-mist/10 bg-charcoal/40 my-6">
      <div className="text-2xl text-dusk-rose/70 mb-3 select-none">✦</div>
      <h3 className="font-cinzel text-lg tracking-[0.1em] text-ivory mb-2">{title}</h3>
      {description && (
        <p className="font-inter text-sm text-silver-mist/70 max-w-md mx-auto mb-6">
          {description}
        </p>
      )}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="font-cinzel text-xs tracking-[0.2em] uppercase text-silver-mist hover:text-dusk-rose underline underline-offset-8 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
