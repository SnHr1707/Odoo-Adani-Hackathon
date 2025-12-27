/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        odoo: {
          primary: '#714B67', 
          secondary: '#017E84', 
          bg: '#1a1a1a', 
          card: '#242424', 
          border: '#333333',
          text: '#e5e7eb',
        }
      }
    },
  },
  plugins: [],
}