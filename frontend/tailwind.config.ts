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
        background: "#050505",
        surface: "#050505",
        "surface-container-lowest": "#050505",
        "surface-container-low": "#0a0a0a",
        "surface-container": "#0f0f11",
        "surface-container-high": "#18181b",
        "surface-container-highest": "#27272a",
        primary: "#ffffff",
        "on-primary": "#000000",
        "primary-container": "#27272a",
        "on-primary-container": "#ffffff",
        secondary: "#a1a1aa",
        "on-secondary": "#000000",
        "secondary-container": "#18181b",
        "on-secondary-container": "#e4e4e7",
        tertiary: "#52525b",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#27272a",
        "on-tertiary-container": "#d4d4d8",
        error: "#ef4444",
        "on-error": "#000000",
        "error-container": "#450a0a",
        "on-error-container": "#fca5a5",
        "on-background": "#fafafa",
        "on-surface": "#fafafa",
        "on-surface-variant": "#a1a1aa",
        outline: "#3f3f46",
        "outline-variant": "#27272a",
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem"
      },
      spacing: {
        md: "16px",
        xl: "40px",
        unit: "4px",
        gutter: "24px",
        sm: "8px",
        xs: "4px",
        lg: "24px",
        "container-max": "1280px"
      },
      fontFamily: {
        h1: ["var(--font-bricolage)", "sans-serif"],
        "label-caps": ["var(--font-geist)", "sans-serif"],
        h2: ["var(--font-bricolage)", "sans-serif"],
        "body-lg": ["var(--font-geist)", "sans-serif"],
        "h1-mobile": ["var(--font-bricolage)", "sans-serif"],
        "body-md": ["var(--font-geist)", "sans-serif"],
        h3: ["var(--font-bricolage)", "sans-serif"]
      },
      fontSize: {
        h1: ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "800" }],
        "label-caps": ["12px", { lineHeight: "1.0", letterSpacing: "0.1em", fontWeight: "600" }],
        h2: ["32px", { lineHeight: "1.2", fontWeight: "700" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "h1-mobile": ["32px", { lineHeight: "1.2", fontWeight: "800" }],
        "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        h3: ["24px", { lineHeight: "1.3", fontWeight: "600" }]
      }
    },
  },
  plugins: [],
};
export default config;
