/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand greens
        green: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Dark sidebar palette
        sidebar: {
          bg:      '#0f1923',
          hover:   '#1a2a3a',
          active:  '#1e3a2f',
          border:  '#1e2d3d',
          text:    '#8fa3b4',
          heading: '#c5d8e8',
        },
        // Main content area
        surface: {
          100: '#131f2e',
          200: '#172030',
          300: '#1c2d40',
          400: '#243447',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'green-glow': '0 0 20px rgba(34,197,94,0.25)',
        'card': '0 4px 24px rgba(0,0,0,0.35)',
      },
    },
  },
  plugins: [],
}
