import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
  ],
  theme: {
    extend: {
      colors: {
        black: "#404040",
        white: "#ffffff",
      },
      fontFamily: {
        sans: ["Die Grotesk B", ...defaultTheme.fontFamily.sans],
        serif: ["Tiempos Text", ...defaultTheme.fontFamily.serif],
        tiempos: ["Tiempos Text", ...defaultTheme.fontFamily.serif],
        grotesk: ["Die Grotesk B", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
