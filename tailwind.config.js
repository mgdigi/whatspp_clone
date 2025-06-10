/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          green: '#25D366',
          'dark-green': '#128C7E',
          'light-green': '#DCF8C6',
          'bg-dark': '#0B141A',
          'bg-light': '#202C33',
          'bg-chat': '#0F1419',
          'text-light': '#E9EDEF',
          'text-secondary': '#8696A0',
        }
      }
    },
  },
  plugins: [],
}