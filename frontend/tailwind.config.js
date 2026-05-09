/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // paleta jurídica investigativa (deep navy + gold)
        bg: "#0a1628",
        panel: "#11233f",
        soft: "#16294a",
        accent: "#c8a45c",        // gold
        "accent-soft": "#b58e3f",
        muted: "#9ba8bd",
        edge: "#1f3559",
        ink: "#e8e3d3",
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
