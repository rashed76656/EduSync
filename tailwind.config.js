/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        primary: {
          light: '#a5a6f6',
          DEFAULT: '#6366F1', // Indigo
          dark: '#4f46e5',
        },
        secondary: {
          light: '#a78bfa',
          DEFAULT: '#8B5CF6', // Violet
          dark: '#7c3aed',
        },
        accent: {
          DEFAULT: '#06B6D4', // Cyan
        },
        success: '#10B981', // Emerald
        warning: '#F59E0B', // Amber
        danger: '#EF4444', // Red
        muted: '#9CA3AF', // Light Gray
      },
    },
  },
  plugins: [],
}
