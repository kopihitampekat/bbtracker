import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0a0a0f",
          secondary: "#12121a",
          tertiary: "#1a1a2e",
          card: "#16162a",
        },
        accent: {
          green: "#00ff88",
          red: "#ff4757",
          orange: "#ffa502",
          blue: "#3742fa",
          purple: "#a855f7",
          cyan: "#00d2d3",
        },
        text: {
          primary: "#e2e8f0",
          secondary: "#94a3b8",
          muted: "#64748b",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
