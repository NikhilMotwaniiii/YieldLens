import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#171915",
        muted: "#6d7169",
        line: "#d8d4c8",
        paper: "#eef1eb",
        panel: "#fffaf0",
        night: "#11150f",
        "night-soft": "#20271d",
        accent: "#00897b",
        "accent-soft": "#d9f1eb",
        brass: "#b8852f",
        copper: "#a95f3d",
        steel: "#4e6d79",
        warning: "#b56c00",
        loss: "#c8463f"
      },
      boxShadow: {
        panel: "0 18px 45px rgba(23, 25, 21, 0.10)",
        desk: "0 22px 60px rgba(17, 21, 15, 0.24)"
      }
    }
  },
  plugins: []
};

export default config;
