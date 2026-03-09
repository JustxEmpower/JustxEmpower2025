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
        codex: {
          black: "#0A0A0A",
          deep: "#12090F",
          plum: "#1A0E17",
          dark: "#1E1118",
          wine: "#2A1520",
          muted: "#3D2233",
          gold: "#C9A84C",
          "gold-light": "#D4B96E",
          "gold-dim": "#8B7332",
          cream: "#F5E6D3",
          "cream-dark": "#D4C4B0",
          parchment: "#2C1F28",
          ember: "#8B3A3A",
          "ember-light": "#A85454",
          sage: "#4A6B4A",
          moonlight: "#C5B8D0",
        },
      },
      fontFamily: {
        cormorant: ["Cormorant Garamond", "serif"],
        inter: ["Inter", "sans-serif"],
        cinzel: ["Cinzel", "serif"],
      },
      animation: {
        "fade-up": "fadeUp 700ms ease-out",
        "fade-in": "fadeIn 1000ms ease-in-out",
        "slow-pulse": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "gold-glow": "goldGlow 3s ease-in-out infinite alternate",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        goldGlow: {
          "0%": { boxShadow: "0 0 5px rgba(201, 168, 76, 0.1)" },
          "100%": { boxShadow: "0 0 20px rgba(201, 168, 76, 0.3)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      transitionDuration: {
        "800": "800ms",
        "1200": "1200ms",
        "2000": "2000ms",
        "3000": "3000ms",
      },
    },
  },
  plugins: [],
};
export default config;
