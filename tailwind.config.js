/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'oc-bg': '#080b12',
        'oc-surface': '#0e1320',
        'oc-border': '#1a2236',
        'oc-hover': '#141c2e',
      },
    },
  },
  plugins: [],
}
