import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0D0B10',
        charcoal: '#19151D',
        'royal-plum': '#392544',
        'muted-violet': '#80658F',
        'silver-mist': '#C8C1CE',
        'ivory-white': '#F2EFF4',
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        inter: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gothic-radial': 'radial-gradient(circle at top, #392544 0%, #0D0B10 70%)',
        'gothic-card': 'linear-gradient(135deg, rgba(25, 21, 29, 0.8) 0%, rgba(13, 11, 16, 0.95) 100%)',
      },
    },
  },
  plugins: [],
} satisfies Config;
