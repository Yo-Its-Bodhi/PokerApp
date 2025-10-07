/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-background': '#0a0e1a',
        'brand-surface': '#141b2d',
        'brand-cyan': '#00ffff',
        'brand-cyan-dark': '#00b8d4',
        'brand-magenta': '#ff00ff',
        'brand-magenta-dark': '#c700c7',
        'brand-blue': '#0080ff',
        'brand-electric': '#00ff88',
        'brand-text': '#e0e8ff',
        'brand-text-dark': '#7a8aad',
      },
      boxShadow: {
        'glow-cyan': '0 0 10px rgba(0, 255, 255, 0.6), 0 0 20px rgba(0, 255, 255, 0.4), 0 0 40px rgba(0, 255, 255, 0.2)',
        'glow-magenta': '0 0 10px rgba(255, 0, 255, 0.6), 0 0 20px rgba(255, 0, 255, 0.4), 0 0 40px rgba(255, 0, 255, 0.2)',
        'glow-electric': '0 0 10px rgba(0, 255, 136, 0.6), 0 0 20px rgba(0, 255, 136, 0.4)',
        'neon': '0 0 5px currentColor, 0 0 10px currentColor, 0 0 20px currentColor',
      },
      keyframes: {
        'glow': {
          '0%, 100%': { opacity: 0.7, boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)' },
          '50%': { opacity: 1, boxShadow: '0 0 40px rgba(0, 255, 255, 0.8), 0 0 60px rgba(0, 255, 255, 0.4)' },
        },
        'pulse-neon': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        'slide-in': {
          '0%': { transform: 'translateY(100%)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        'flicker': {
          '0%, 100%': { opacity: 1 },
          '41.99%': { opacity: 1 },
          '42%': { opacity: 0 },
          '43%': { opacity: 0 },
          '43.01%': { opacity: 1 },
        }
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite',
        'pulse-neon': 'pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slide-in 0.5s ease-out forwards',
        'flicker': 'flicker 3s linear infinite',
      },
    },
  },
  plugins: [],
}
