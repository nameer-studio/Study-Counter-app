import type { Config } from "tailwindcss";

/**
 * Colours resolve to CSS variables (defined per-theme in globals.css) rather than
 * literal hex, so the same utility class works across Light / Dark / AMOLED. The
 * literal values live in exactly one place — globals.css — mirroring how the Android
 * port keeps them in Color.kt.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        surface2: "var(--surface2)",
        border: "var(--border)",
        text: "var(--text)",
        dim: "var(--dim)",
        primary: "var(--primary)",
        "primary-on": "var(--primary-on)",
        green: "var(--green)",
        amber: "var(--amber)",
        red: "var(--red)",
        grey: "var(--grey)",
        streak: "var(--streak)",
        ring: "var(--ring)",
        // Six fixed paper colours — identical across all three themes.
        "paper-accounts": "var(--paper-accounts)",
        "paper-law": "var(--paper-law)",
        "paper-tax": "var(--paper-tax)",
        "paper-costing": "var(--paper-costing)",
        "paper-audit": "var(--paper-audit)",
        "paper-fmsm": "var(--paper-fmsm)",
      },
      borderRadius: {
        card: "16px",
        "card-lg": "22px",
        button: "11px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Design system type scale (DS file "Type · 05").
        overline: ["11px", { lineHeight: "14px", letterSpacing: "0.14em", fontWeight: "700" }],
        caption: ["12px", { lineHeight: "15px", letterSpacing: "0.01em", fontWeight: "500" }],
        label: ["13px", { lineHeight: "16px", letterSpacing: "0.005em", fontWeight: "500" }],
        body: ["14px", { lineHeight: "21px", fontWeight: "400" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        subtitle: ["18px", { lineHeight: "24px", fontWeight: "600" }],
        title: ["22px", { lineHeight: "26px", letterSpacing: "-0.01em", fontWeight: "600" }],
        headline: ["34px", { lineHeight: "38px", letterSpacing: "-0.01em", fontWeight: "700" }],
        display: ["60px", { lineHeight: "60px", letterSpacing: "-0.03em", fontWeight: "800" }],
        // Dashboard countdown hero.
        hero: ["76px", { lineHeight: "0.85", letterSpacing: "-0.04em", fontWeight: "800" }],
        "hero-lg": ["112px", { lineHeight: "0.82", letterSpacing: "-0.04em", fontWeight: "800" }],
      },
      keyframes: {
        // The only decorative animation in the app — the running timer ring.
        breathe: {
          "0%, 100%": { transform: "scale(0.97)", opacity: "0.85" },
          "50%": { transform: "scale(1.03)", opacity: "1" },
        },
      },
      animation: {
        breathe: "breathe 4.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
