/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        testBlue: "#3b82f6",
        testGreen: "#22c55e",
        testOrange: "#f97316",
      },
    },
  },
  darkMode: "class",
  plugins: [],
};
