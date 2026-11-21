import React from 'react';

interface EventPosterProps {
  id?: string;
  title?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const EventPoster: React.FC<EventPosterProps> = ({
  id = 'default',
  className = '',
}) => {
  // Generate deterministic visual variations based on string hash
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variant = hash % 4; // 0, 1, 2, 3

  // Palet aksen halus untuk kartu tarot
  const themes = [
    { primary: '#80658F', secondary: '#392544', highlight: '#D9A5A0', symbol: 'moon' },
    { primary: '#957BA5', secondary: '#24172B', highlight: '#C8C1CE', symbol: 'sun' },
    { primary: '#71547F', secondary: '#19151D', highlight: '#D9A5A0', symbol: 'crystal' },
    { primary: '#B9A5C8', secondary: '#302936', highlight: '#F2EFF4', symbol: 'astral' },
  ];

  const currentTheme = themes[variant];

  return (
    <div
      className={`relative overflow-hidden aspect-[2/3] w-full bg-charcoal border border-silver-mist/20 p-3 flex flex-col items-center justify-between transition-all duration-300 group ${className}`}
      style={{
        background: `radial-gradient(ellipse at 50% 30%, ${currentTheme.secondary} 0%, #19151D 60%, #0D0B10 100%)`,
      }}
    >
      {/* Ornamen Garis Tipis Ganda Khas Kartu Tarot */}
      <div className="absolute inset-1.5 border border-silver-mist/25 pointer-events-none" />
      <div className="absolute inset-2 border border-silver-mist/10 pointer-events-none" />

      {/* Sudut Ornamen Bintang ✦ */}
      <div className="absolute top-2.5 left-2.5 text-[8px] text-dusk-rose/70 select-none">✦</div>
      <div className="absolute top-2.5 right-2.5 text-[8px] text-dusk-rose/70 select-none">✦</div>
      <div className="absolute bottom-2.5 left-2.5 text-[8px] text-dusk-rose/70 select-none">✦</div>
      <div className="absolute bottom-2.5 right-2.5 text-[8px] text-dusk-rose/70 select-none">✦</div>

      {/* Header Kartu: Label Tarot Kecil */}
      <div className="pt-2 text-center z-10">
        <span className="text-[10px] tracking-[0.25em] uppercase text-silver-mist/70 font-cinzel">
          ARCANA · {['I', 'VII', 'IX', 'XIII'][variant]}
        </span>
      </div>

      {/* Ilustrasi Vektor Line-Art Celestial di Tengah */}
      <div className="relative w-full flex-1 flex items-center justify-center my-2 z-10">
        <svg
          viewBox="0 0 200 240"
          className="w-4/5 h-4/5 max-h-[180px] text-silver-mist/60 group-hover:text-dusk-rose/90 transition-colors duration-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          {/* Lingkaran Konsentris Geometris */}
          <circle cx="100" cy="120" r="70" strokeDasharray="3 3" opacity="0.3" />
          <circle cx="100" cy="120" r="55" opacity="0.5" />
          <circle cx="100" cy="120" r="40" opacity="0.4" />

          {variant === 0 && (
            /* Bulan Sabit Gothic + Bintang */
            <g>
              <path
                d="M100 80 A40 40 0 1 0 100 160 A30 30 0 1 1 100 80 Z"
                fill="currentColor"
                fillOpacity="0.15"
              />
              <circle cx="125" cy="105" r="4" fill="currentColor" opacity="0.7" />
              <line x1="100" y1="50" x2="100" y2="70" opacity="0.5" />
              <line x1="100" y1="170" x2="100" y2="190" opacity="0.5" />
              <line x1="30" y1="120" x2="50" y2="120" opacity="0.5" />
              <line x1="150" y1="120" x2="170" y2="120" opacity="0.5" />
              <polygon points="100,105 103,115 113,115 105,121 108,131 100,125 92,131 95,121 87,115 97,115" opacity="0.8" />
            </g>
          )}

          {variant === 1 && (
            /* Radiating Sun Lines + Mata Mistis */
            <g>
              {Array.from({ length: 16 }).map((_, i) => {
                const angle = (i * 360) / 16;
                const rad = (angle * Math.PI) / 180;
                const x1 = 100 + 45 * Math.cos(rad);
                const y1 = 120 + 45 * Math.sin(rad);
                const x2 = 100 + (i % 2 === 0 ? 68 : 58) * Math.cos(rad);
                const y2 = 120 + (i % 2 === 0 ? 68 : 58) * Math.sin(rad);
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} opacity="0.6" />;
              })}
              <circle cx="100" cy="120" r="28" fill="currentColor" fillOpacity="0.1" />
              <path d="M75 120 Q100 95 125 120 Q100 145 75 120 Z" />
              <circle cx="100" cy="120" r="10" fill="currentColor" opacity="0.7" />
            </g>
          )}

          {variant === 2 && (
            /* Kristal Oktahedron + Garis Kosmik */
            <g>
              <polygon points="100,65 140,120 100,175 60,120" fill="currentColor" fillOpacity="0.12" />
              <line x1="100" y1="65" x2="100" y2="175" opacity="0.7" />
              <line x1="60" y1="120" x2="140" y2="120" opacity="0.7" />
              <polygon points="100,85 125,120 100,155 75,120" opacity="0.5" />
              <circle cx="100" cy="65" r="3" fill="currentColor" />
              <circle cx="100" cy="175" r="3" fill="currentColor" />
              <circle cx="60" cy="120" r="3" fill="currentColor" />
              <circle cx="140" cy="120" r="3" fill="currentColor" />
            </g>
          )}

          {variant === 3 && (
            /* Kompas Bintang Astral + Kisi Geometris */
            <g>
              <polygon points="100,60 108,112 160,120 108,128 100,180 92,128 40,120 92,112" fill="currentColor" fillOpacity="0.2" />
              <circle cx="100" cy="120" r="18" strokeDasharray="2 2" opacity="0.7" />
              <circle cx="100" cy="120" r="6" fill="currentColor" opacity="0.8" />
              <line x1="70" y1="90" x2="130" y2="150" opacity="0.4" />
              <line x1="130" y1="90" x2="70" y2="150" opacity="0.4" />
            </g>
          )}
        </svg>
      </div>

      {/* Ornamen Pembatas Bawah */}
      <div className="w-full text-center pb-2 z-10 flex items-center justify-center space-x-2">
        <div className="h-[1px] w-6 bg-silver-mist/20" />
        <span className="text-[10px] text-dusk-rose">✦</span>
        <div className="h-[1px] w-6 bg-silver-mist/20" />
      </div>
    </div>
  );
};
