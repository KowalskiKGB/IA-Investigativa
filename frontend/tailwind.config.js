/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // paleta inspirada no tema Obsidian dark
        bg: "#1e1e1e",
        panel: "#262626",
        accent: "#7f6df2",
        muted: "#8a8a8a",
        edge: "#3a3a3a",
        ink: "#dcddde",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
