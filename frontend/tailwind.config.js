/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          950: "#06070a",
          900: "#0a0e17",
          800: "#0f1117",
          700: "#14161e",
          600: "#1a1d27",
          500: "#22252f",
        },
        accent: {
          red: "#ff4d4d",
          amber: "#ffb800",
          green: "#16a34a",
          blue: "#2563eb",
          cyan: "#0891b2",
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
