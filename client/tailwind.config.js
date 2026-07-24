/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f2f5f7',
          100: '#dde5ea',
          200: '#b9c9d3',
          300: '#8ea8b8',
          400: '#5c7f95',
          500: '#3d6478',
          600: '#2c4d5f',
          700: '#233e4c',
          800: '#1b2f3a',
          900: '#101c24'
        },
        clay: {
          50: '#fdf3ec',
          100: '#fbe3cf',
          200: '#f6c496',
          300: '#eea25e',
          400: '#e08332',
          500: '#c2661e',
          600: '#994f18',
          700: '#733a12',
          800: '#4d270c'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
