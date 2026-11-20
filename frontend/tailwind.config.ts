import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Soft Gothic Luxury Palette
        ivory: '#F9F6F2',
        pearl: '#F3EFF5',
        'soft-gray': '#E4DFE7',
        'silver-mist': '#C8C1CE',
        'warm-gray': '#827B85',

        'soft-lavender': '#E9E0EF',
        'dusty-purple': '#B9A5C8',
        'muted-violet': '#80658F',
        'royal-mauve': '#957BA5',

        charcoal: '#302936',
        'muted-charcoal': '#514957',
        secondary: '#817986',

        'soft-lilac': '#D9C7E5',
        'pale-silver': '#D8D3DD',
        plum: '#71547F',
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft-card': '0 4px 20px -2px rgba(48, 41, 54, 0.05)',
        'soft-hover': '0 10px 25px -4px rgba(128, 101, 143, 0.12)',
        'soft-dropdown': '0 12px 32px -4px rgba(48, 41, 54, 0.08)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [],
} satisfies Config;
