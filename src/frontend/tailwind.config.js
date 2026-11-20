/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx,html,css}"],
  theme: {
    extend: {
      colors: {
        canvas: "#fafaf9",
        paper: "#ffffff",
        band: "#f0efee",
        soft: "#f5f5f4",
        hairline: "#e7e5e4",
        softline: "#d6d3d1",
        ink: "#0c0a09",
        body: "#44403c",
        muted: "#78716c",
        placeholder: "#a8a29e",
        brand: "#2b69f6",
        "brand-hover": "#2a54ec",
        "brand-wash": "#eff5fe",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "inset 0 0.5px 0 rgba(255,255,255,0.06), 0 8px 20px -4px rgba(0,0,0,0.08), 0 20px 40px -10px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
        subtle: "0 1px 2px 0 rgba(30,18,10,0.05), 0 0 0 1px rgba(30,18,10,0.03)",
        elevated:
          "0 2px 4px -1px rgba(30,18,10,0.06), 0 8px 20px -6px rgba(30,18,10,0.10), 0 0 0 1px rgba(30,18,10,0.04)",
        inset: "inset 0 1px 0 0 rgba(255,255,255,0.5)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "index-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.28s cubic-bezier(0.4,0,0.2,1) both",
        "slide-in-right": "slide-in-right 0.24s cubic-bezier(0.4,0,0.2,1) both",
        "index-pulse": "index-pulse 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
