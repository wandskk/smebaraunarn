import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9eaff",
          200: "#bcdaff",
          300: "#8ec2ff",
          400: "#589eff",
          500: "#2f78ff",
          600: "#1a58f5",
          700: "#1544d1",
          800: "#1739a8",
          900: "#183485",
          950: "#0f1e50",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
