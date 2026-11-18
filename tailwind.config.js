/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        surface: 'var(--surface)',
        surface2: 'var(--surface-2)',
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        'ink-faint': 'var(--ink-faint)',
        line: 'var(--line)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        'accent-ink': 'var(--accent-ink)',
        'on-accent': 'var(--on-accent)',
        danger: 'var(--danger)',
        success: 'var(--success)',
      },
      fontFamily: {
        sans: [
          'Segoe UI',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        serif: [
          'Iowan Old Style',
          'Palatino Linotype',
          'Palatino',
          'Book Antiqua',
          'Georgia',
          'Times New Roman',
          'serif',
        ],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        float: 'var(--shadow-float)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        rise: {
          from: { opacity: '0', transform: 'translateY(10px) scale(0.99)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out',
        rise: 'rise 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        'pulse-soft': 'pulse-soft 1.1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
