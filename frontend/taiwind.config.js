/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'villa-primary': '#2A5D8A',
        'villa-secondary': '#E85D75',
        'villa-accent': '#F4A261',
        'villa-warm': '#E9C46A',
        'villa-dark': '#264653',
        'villa-light': '#F8F5F0',
        'villa-success': '#2A9D8F',
      },
      fontSize: {
        'idoso-xs': ['1.25rem', { lineHeight: '1.75rem' }],
        'idoso-sm': ['1.5rem', { lineHeight: '2rem' }],
        'idoso-base': ['1.75rem', { lineHeight: '2.25rem' }],
        'idoso-lg': ['2rem', { lineHeight: '2.5rem' }],
        'idoso-xl': ['2.5rem', { lineHeight: '3rem' }],
        'idoso-2xl': ['3rem', { lineHeight: '3.5rem' }],
        'idoso-3xl': ['3.5rem', { lineHeight: '4rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      }
    },
  },
  plugins: [],
}