/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      keyframes: {
        'rest-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.04)' },
        },
      },
      animation: {
        'rest-pulse': 'rest-pulse 1s ease-in-out',
      },
      colors: {
        accent: '#c8ff00',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        border: 'hsl(var(--border))',
        ring: 'hsl(var(--ring))',
      },
      fontFamily: {
        display: ['Barlow Condensed', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
