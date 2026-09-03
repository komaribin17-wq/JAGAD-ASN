/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#EDEAE0',
        paperDark: '#E2DECE',
        ink: '#1C2B22',
        seal: {
          50: '#EAF1EC',
          200: '#B9CFC0',
          400: '#4F8A67',
          600: '#245C3B',
          700: '#1C4830',
          900: '#0F2B1C',
        },
        bronze: {
          200: '#E4D4AC',
          400: '#C7A455',
          600: '#B08D3E',
          700: '#8A6D2C',
        },
        risk: {
          low: '#3F7D4F',
          medium: '#C08A2E',
          high: '#A13A2E',
        },
        line: '#D8D3C2',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        seal: '4px',
      },
    },
  },
  plugins: [],
}
