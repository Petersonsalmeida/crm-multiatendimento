/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        whatsapp: {
          primary: '#25d366',
          'primary-hover': '#1fbb59',
          secondary: '#128c7e',
          'secondary-hover': '#0e7269',
          dark: '#075e54',
        },
        bg: {
          base: '#0b141a',
          surface: '#111b21',
          elevated: '#202c33',
          hover: '#2a3942',
        },
        text: {
          primary: '#e9edef',
          muted: '#8696a0',
          subtle: '#667781',
        },
        border: {
          subtle: '#222d34',
          DEFAULT: '#2a3942',
        },
        danger: {
          DEFAULT: '#f15c6d',
          hover: '#d94a5b',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      borderRadius: {
        lg: '0.625rem',
      },
    },
  },
  plugins: [],
};
