/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: { 900: "#0a0a0f", 800: "#12121a", 700: "#1a1a25", 600: "#222230" },
      },
    },
  },
  plugins: [],
};
