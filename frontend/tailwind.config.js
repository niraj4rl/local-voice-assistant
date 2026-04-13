/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0d1117',
        slate: '#161b22',
        panel: 'rgba(22, 27, 34, 0.72)',
        line: '#2f3843',
        accent: '#2f81f7',
        mint: '#3fb950',
        amber: '#d29922',
        rose: '#f85149'
      },
      boxShadow: {
        glow: '0 10px 30px rgba(47, 129, 247, 0.22)'
      },
      keyframes: {
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
        rise: 'rise 500ms ease forwards',
        pulseRing: 'pulseRing 1.2s ease-out infinite'
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Manrope"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    }
  },
  plugins: []
};
