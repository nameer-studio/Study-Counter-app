import type { MetadataRoute } from "next";

/**
 * Next.js's typed manifest convention — served at /manifest.webmanifest and linked
 * automatically. Enables "Add to Home Screen" installability (PLAN.md WEB_PLAN §2.4).
 * No service worker is registered alongside this (a full offline cache was scoped out
 * as marginal value for local dev — see WEB_PLAN's PWA note); installability and a
 * standalone window are what this delivers, not offline support.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Study Counter — CA study planner & tracker",
    short_name: "Study Counter",
    description:
      "Track study hours, plan your attempt, and see whether you're on pace — built for Indian CA students.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0f111a",
    theme_color: "#3d49c9",
    orientation: "portrait-primary",
    // "any" only — the source art fills close to the full canvas with no safe-zone
    // padding, so declaring "maskable" would let Android/Chrome crop it to a circle
    // and clip the ring. Fix would be a padded variant, not a purpose flag.
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
