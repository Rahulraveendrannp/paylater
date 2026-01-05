/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'heading': ['Arial Black', 'sans-serif'],
        'body': ['Arial', 'sans-serif'],
      },
      colors: {
        'paylater-purple': '#4A148C',
        'paylater-teal': '#14B8A6',
      }
    },
  },
  plugins: [],
}

