import type { Config } from "tailwindcss";

/**
 * Lê um token HSL de app/globals.css (formato "H S% L%") e devolve um valor
 * hsl() com suporte a opacidade via modificador (ex.: bg-primary/10) — ver
 * globals.css para a lista completa de tokens e o racional de cada um.
 */
function tokenColor(variable: string) {
  return `hsl(var(${variable}) / <alpha-value>)`;
}

function semanticScale(name: string) {
  return {
    DEFAULT: tokenColor(`--${name}`),
    foreground: tokenColor(`--${name}-foreground`),
    subtle: {
      DEFAULT: tokenColor(`--${name}-subtle`),
      foreground: tokenColor(`--${name}-subtle-foreground`),
    },
  };
}

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
        // Tokens do design system administrativo — ver app/globals.css.
        // Aditivos: não substituem `brand`/slate já usados nas páginas atuais.
        background: tokenColor("--background"),
        surface: {
          DEFAULT: tokenColor("--surface"),
          muted: tokenColor("--surface-muted"),
        },
        foreground: {
          DEFAULT: tokenColor("--foreground"),
          muted: tokenColor("--foreground-muted"),
        },
        border: tokenColor("--border"),
        ring: tokenColor("--ring"),
        primary: {
          DEFAULT: tokenColor("--primary"),
          foreground: tokenColor("--primary-foreground"),
          subtle: {
            DEFAULT: tokenColor("--primary-subtle"),
            foreground: tokenColor("--primary-subtle-foreground"),
          },
        },
        success: semanticScale("success"),
        warning: semanticScale("warning"),
        danger: semanticScale("danger"),
        info: semanticScale("info"),
        education: semanticScale("education"),
        attendance: semanticScale("attendance"),
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
