/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#0F766E',
          'teal-light': '#14B8A6',
          bg: '#F9FAFB',
          dark: '#111827',
        },
        model: {
          baseline: '#6B7280',
          hue_only: '#F59E0B',
          saturation_only: '#3B82F6',
          brightness_only: '#F97316',
          broad_colorjitter: '#8B5CF6',
          all_factor: '#0F766E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
