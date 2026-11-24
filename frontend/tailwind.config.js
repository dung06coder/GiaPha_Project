/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: '#FDFBF7', // Nền giấy sắc phong nhạt
        crimson: '#8B1E1E',   // Đỏ son / Đỏ trầm chủ đạo
        wood: '#5C3A21',      // Nâu gỗ lim
        gold: '#D4AF37',      // Vàng đồng / Hoàng kim
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Be Vietnam Pro"', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}