import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        "background-muted": "var(--color-background-muted)",
        "foreground-muted": "var(--color-foreground-muted)",
        brand: "var(--color-brand)",
        "brand-muted": "var(--color-brand-muted)",
        border: "var(--color-border)",
        "border-muted": "var(--color-border-muted)",
        surface: "var(--color-surface)",
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "40px",
        "2xl": "64px",
        "3xl": "96px",
        unit: "4px",
        gutter: "24px",
        "container-max": "1280px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "Fira Code", "monospace"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.5" }],
        sm: ["0.875rem", { lineHeight: "1.5" }],
        base: ["1rem", { lineHeight: "1.6" }],
        lg: ["1.125rem", { lineHeight: "1.5" }],
        xl: ["1.25rem", { lineHeight: "1.4" }],
        "2xl": ["1.5rem", { lineHeight: "1.3" }],
        "3xl": ["2rem", { lineHeight: "1.2" }],
        "4xl": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
      },
      gridTemplateColumns: {
        "12": "repeat(12, minmax(0, 1fr))",
      },
      animation: {
        "pulse-custom": "pulse 2s ease-in-out infinite",
        "slide-in-bottom": "slideInFromBottom 1.4s var(--ease-power4-in-out) both",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        slideInFromBottom: {
          from: { transform: "translateY(110%)" },
          to: { transform: "translateY(0%)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      transitionTimingFunction: {
        "power4": "var(--ease-power4-in-out)",
        "power3": "var(--ease-power3-in-out)",
        "quart": "var(--ease-in-out-quart)",
        "back": "var(--ease-out-back)",
        "underline": "var(--ease-underline)",
      },
      transitionDuration: {
        "700": "700ms",
      },
    },
  },
  plugins: [],
};
export default config;
