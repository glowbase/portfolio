/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Calibre","Inter","San Francisco","system-ui","sans-serif"],
        mono: ["SF Mono","Fira Code","Roboto Mono","monospace"]
      }
    }
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ]
};