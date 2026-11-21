import React, { useState } from 'react';

interface EventPosterProps {
  id?: string;
  title?: string;
  imageUrl?: string | null;
  category?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const EventPoster: React.FC<EventPosterProps> = ({
  id = 'default',
  title = '',
  imageUrl,
  category,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

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

  // Deteksi kategori dari judul/deskripsi jika tidak diberikan
  const getCategoryLabel = () => {
    if (category) return category;
    const lower = (title || '').toLowerCase();
    if (lower.includes('orchestra') || lower.includes('symphony') || lower.includes('orkestra')) return 'ORCHESTRA';
    if (lower.includes('masquerade') || lower.includes('teater') || lower.includes('drama')) return 'TEATER & SENI';
    if (lower.includes('electronic') || lower.includes('gathering') || lower.includes('konser')) return 'KONSER & MUSIK';
    if (lower.includes('canvas') || lower.includes('sculpture') || lower.includes('exhibition') || lower.includes('pameran')) return 'EXHIBITION';
    return 'GOTHIC ARTS';
  };

  const detectedCategory = getCategoryLabel();

  return (
    <div
      className={`relative overflow-hidden aspect-[2/3] w-full bg-charcoal border border-silver-mist/20 p-3 flex flex-col items-center justify-between transition-all duration-300 group ${className}`}
      style={{
        background: `radial-gradient(ellipse at 50% 30%, ${currentTheme.secondary} 0%, #19151D 60%, #0D0B10 100%)`,
      }}
    >
      {/* Gambar Foto Pertunjukan Nyata (jika ada) */}
      {imageUrl && !imageError && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={imageUrl}
            alt={title || 'Event poster'}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-85 group-hover:scale-105 transition-all duration-700 ease-out"
          />
          {/* Gradient Overlay Gelap Khas Soft Gothic Luxury */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0B10] via-[#19151D]/60 to-[#0D0B10]/40 pointer-events-none" />
          <div className="absolute inset-0 bg-royal-plum/20 mix-blend-multiply pointer-events-none" />
        </div>
      )}

      {/* Ornamen Garis Tipis Ganda Khas Kartu Tarot */}
      <div className="absolute inset-1.5 border border-silver-mist/25 pointer-events-none z-10" />
      <div className="absolute inset-2 border border-silver-mist/10 pointer-events-none z-10" />

      {/* Sudut Ornamen Bintang ✦ */}
      <div className="absolute top-2.5 left-2.5 text-[8px] text-dusk-rose/80 select-none z-10">✦</div>
      <div className="absolute top-2.5 right-2.5 text-[8px] text-dusk-rose/80 select-none z-10">✦</div>
      <div className="absolute bottom-2.5 left-2.5 text-[8px] text-dusk-rose/80 select-none z-10">✦</div>
      <div className="absolute bottom-2.5 right-2.5 text-[8px] text-dusk-rose/80 select-none z-10">✦</div>

      {/* Header Kartu: Label Arcana & Badge Kategori */}
      <div className="pt-2 text-center z-10 flex flex-col items-center space-y-1">
        <span className="text-[9px] tracking-[0.25em] uppercase text-silver-mist/80 font-cinzel">
          ARCANA · {['I', 'VII', 'IX', 'XIII'][variant]}
        </span>
        <span className="text-[8px] tracking-[0.2em] uppercase font-cinzel text-dusk-rose bg-obsidian/85 px-2 py-0.5 border border-dusk-rose/40 shadow-sm backdrop-blur-[2px]">
          {detectedCategory}
        </span>
      </div>

      {/* Ilustrasi Vektor Thematic (Ditampilkan jika gambar belum ada atau fallback) */}
      {(!imageUrl || imageError) && (
        <div className="relative w-full flex-1 flex items-center justify-center my-2 z-10">
          <svg
            viewBox="0 0 200 240"
            className="w-4/5 h-4/5 max-h-[180px] text-silver-mist/70 group-hover:text-dusk-rose/90 transition-colors duration-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            {/* Lingkaran Konsentris Geometris */}
            <circle cx="100" cy="120" r="70" strokeDasharray="3 3" opacity="0.3" />
            <circle cx="100" cy="120" r="55" opacity="0.5" />
            <circle cx="100" cy="120" r="40" opacity="0.4" />

            {/* Ilustrasi Berdasarkan Kategori */}
            {detectedCategory === 'ORCHESTRA' && (
              /* Cello / Biola Katedral Gothic */
              <g>
                <path
                  d="M100 60 C80 60 70 85 85 105 C70 120 70 150 85 170 C95 180 105 180 115 170 C130 150 130 120 115 105 C130 85 120 60 100 60 Z"
                  fill="currentColor"
                  fillOpacity="0.15"
                />
                <line x1="100" y1="40" x2="100" y2="190" strokeWidth="1.5" />
                <line x1="97" y1="50" x2="97" y2="180" opacity="0.7" />
                <line x1="103" y1="50" x2="103" y2="180" opacity="0.7" />
                <circle cx="100" cy="115" r="3" fill="currentColor" />
                <path d="M88 125 Q92 135 88 145" strokeWidth="1.5" />
                <path d="M112 125 Q108 135 112 145" strokeWidth="1.5" />
              </g>
            )}

            {detectedCategory === 'TEATER & SENI' && (
              /* Topeng Teater Masquerade Gothic */
              <g>
                <path
                  d="M60 105 C60 90 80 85 100 95 C120 85 140 90 140 105 C140 135 120 150 100 150 C80 150 60 135 60 105 Z"
                  fill="currentColor"
                  fillOpacity="0.18"
                />
                <path d="M72 105 Q85 98 95 108 Q85 115 72 105 Z" fill="#0D0B10" stroke="currentColor" />
                <path d="M128 105 Q115 98 105 108 Q115 115 128 105 Z" fill="#0D0B10" stroke="currentColor" />
                <path d="M100 110 L100 125" />
                <path d="M85 135 Q100 142 115 135" />
                <path d="M100 70 L100 85" strokeDasharray="2 2" />
                <polygon points="100,68 103,75 110,75 104,80 107,88 100,83 93,88 96,80 90,75 97,75" fill="currentColor" />
              </g>
            )}

            {detectedCategory === 'KONSER & MUSIK' && (
              /* Gelombang Suara & Synthesizer Darkwave */
              <g>
                <rect x="65" y="100" width="70" height="40" fill="currentColor" fillOpacity="0.15" />
                <line x1="75" y1="100" x2="75" y2="140" />
                <line x1="85" y1="100" x2="85" y2="140" />
                <line x1="95" y1="100" x2="95" y2="140" />
                <line x1="105" y1="100" x2="105" y2="140" />
                <line x1="115" y1="100" x2="115" y2="140" />
                <line x1="125" y1="100" x2="125" y2="140" />
                <path d="M40 80 Q70 50 100 80 T160 80" strokeWidth="1.5" />
                <path d="M40 160 Q70 190 100 160 T160 160" strokeWidth="1.5" />
                <circle cx="100" cy="70" r="4" fill="currentColor" />
              </g>
            )}

            {detectedCategory === 'EXHIBITION' && (
              /* Bingkai Galeri Antik & Patung Surealis */
              <g>
                <rect x="65" y="75" width="70" height="90" fill="currentColor" fillOpacity="0.12" strokeWidth="1.5" />
                <rect x="72" y="82" width="56" height="76" strokeDasharray="2 2" opacity="0.6" />
                <circle cx="100" cy="110" r="14" fill="currentColor" fillOpacity="0.2" />
                <polygon points="100,90 115,115 85,115" opacity="0.8" />
                <line x1="100" y1="125" x2="100" y2="145" />
                <line x1="85" y1="145" x2="115" y2="145" strokeWidth="1.5" />
              </g>
            )}
          </svg>
        </div>
      )}

      {/* Bagian Bawah Gambar jika ada image: Spacer */}
      {imageUrl && !imageError && <div className="flex-1" />}

      {/* Ornamen Pembatas Bawah */}
      <div className="w-full text-center pb-2 z-10 flex items-center justify-center space-x-2">
        <div className="h-[1px] w-6 bg-silver-mist/30" />
        <span className="text-[10px] text-dusk-rose">✦</span>
        <div className="h-[1px] w-6 bg-silver-mist/30" />
      </div>
    </div>
  );
};
