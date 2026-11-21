import React from 'react';

interface SectionDividerProps {
  className?: string;
}

export const SectionDivider: React.FC<SectionDividerProps> = ({ className = '' }) => {
  return (
    <div className={`w-full flex items-center justify-center my-12 ${className}`}>
      <div className="h-[1px] flex-1 max-w-xs bg-silver-mist/15" />
      <span className="mx-4 text-xs text-dusk-rose/80 select-none">✦</span>
      <div className="h-[1px] flex-1 max-w-xs bg-silver-mist/15" />
    </div>
  );
};
