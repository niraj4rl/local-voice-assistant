/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'jet-black': '#050505',
        'jet-surface': '#0B0B0B',
        'jet-card': '#111111',
        'jet-border': '#1F1F1F',
        'jet-text': '#EDEDED',
        'jet-secondary': '#8A8A8A',
        'neon-blue': '#3B82F6'
      },
      boxShadow: {
        'neon-glow': '0 0 20px rgba(0, 255, 159, 0.15)'
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        pulseRing: {
          '0%': { transform: 'scale(0.85)', opacity: '0.65' },
          '100%': { transform: 'scale(1.15)', opacity: '0' }
        }
      },
      animation: {
        'fade-in': 'fade-in 300ms ease-out forwards',
        rise: 'rise 500ms ease forwards',
        pulseRing: 'pulseRing 1.2s ease-out infinite'
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    }
  },
  plugins: []
};
