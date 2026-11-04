/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: { extend: {
    colors: { emerald: { 950: '#022c22' } },
    boxShadow: { soft: '0 8px 30px rgba(15, 23, 42, 0.05)' }
  }},
  plugins: []
}