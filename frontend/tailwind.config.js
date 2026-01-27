/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#F4A300',
        secondary: '#2E1A12',
        accent: '#FFD36A',
        background: '#FFF7E6',
      },
    },
  },
  plugins: [],
}


