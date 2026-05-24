/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        army: {
          50:  '#e6eff8',
          100: '#b5d0ed',
          500: '#185FA5',
          600: '#0C447C',
          700: '#042C53',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
