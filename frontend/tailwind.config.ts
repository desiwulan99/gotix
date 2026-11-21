import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark Subtle Gothic Luxury Palette
        obsidian: '#0D0B10', // Latar utama
        charcoal: '#19151D', // Panel & kartu
        'royal-plum': '#392544', // Aksen blok & hover
        'muted-violet': '#80658F', // Aksen garis & pembatas halus
        'silver-mist': '#C8C1CE', // Teks sekunder
        ivory: '#F2EFF4', // Teks utama
        'dusk-rose': '#D9A5A0', // Sorotan hangat (harga, garis bawah CTA)
      },
      fontFamily: {
        unifraktur: ['UnifrakturCook', 'cursive', 'serif'],
        cinzel: ['Cinzel', 'serif'],
        cormorant: ['"Cormorant Garamond"', 'serif'],
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '2px',
        sm: '2px',
        md: '4px',
        lg: '4px',
      },
      boxShadow: {
        'gothic-card': '0 4px 20px rgba(0, 0, 0, 0.6)',
        'gothic-hover': '0 8px 30px rgba(57, 37, 68, 0.4)',
        'dusk-glow': '0 0 15px rgba(217, 165, 160, 0.2)',
      },
    },
  },
  plugins: [],
} satisfies Config;
