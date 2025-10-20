/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        threat: {
          critical: '#dc2626',
          high: '#ea580c',
          medium: '#f59e0b',
          low: '#84cc16',
        },
        cyber: {
          dark: '#0f172a',
          darker: '#020617',
          accent: '#3b82f6',
          glow: '#06b6d4',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #3b82f6, 0 0 10px #3b82f6' },
          '100%': { boxShadow: '0 0 10px #06b6d4, 0 0 20px #06b6d4' },
        }
      }
    },
  },
  plugins: [],
}
