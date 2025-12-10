/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pastel-green': '#e8f5e9',
        'pastel-blue': '#bbdefb',
        'pastel-orange': '#fff3e0',
        'pastel-pink': '#ffebee',
        'border-blue': '#4fc3f7',
        'icon-green': '#c8e6c9',
        'parchment': '#faf3dd',
      },
      fontFamily: {
        sans: ['Quicksand', 'sans-serif'],
        handwriting: ['"Indie Flower"', 'cursive'],
      },
    },
  },
  plugins: [],
}
