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
    },
  },
  plugins: [],
};