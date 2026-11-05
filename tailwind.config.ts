import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#fdf8f1",
        wine: "#7a1f2b",
        gold: "#c9a86a",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        elegant: ["var(--font-elegant)", "serif"],
        script: ["var(--font-script)", "cursive"],
        "eb-garamond": ["var(--font-eb-garamond)", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
