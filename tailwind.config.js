/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#10264A',
          deep: '#0a172e',
          light: '#1b3a6b',
        },
        iuh: {
          DEFAULT: '#2469BC',
          dark: '#1b5296',
          light: '#3a82de',
        },
        paper: {
          DEFAULT: '#F4F7FC',
          warm: '#fbfcfd',
        },
        gold: {
          DEFAULT: '#F0C66D',
          dark: '#cda243',
          light: '#fae3a6',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Merriweather', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { opacity: '0.4' },
          '50%': { opacity: '0.9' },
          '100%': { opacity: '0.4' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        shimmer: 'shimmer 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
