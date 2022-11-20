/* eslint-disable @typescript-eslint/no-var-requires */
const themes = require('daisyui/src/colors/themes')

console.log(__dirname)

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    fontFamily: {
      sans: ['Open Sans, sans-serif'],
    },
    extend: {
      colors: {
        white: '#ffffff',
        black: '#000000',
      },
    },
  },
  daisyui: {
    themes: [
      {
        dark: {
          ...themes['[data-theme=dark]'],
        },
      },
    ],
  },
  plugins: [
    require('tailwindcss-radix')(),
    require('@tailwindcss/typography'),
    require('daisyui'),
  ],
}
