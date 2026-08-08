import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // `next build` and `next dev` both write to the build directory, so running a
  // production build while the dev server is live overwrites the dev server's chunk
  // and CSS manifests — it then serves 404s for files that no longer exist (blank
  // page, missing Tailwind, "Cannot find module './xyz.js'"). Routing builds to a
  // separate directory via NEXT_DIST_DIR makes that collision impossible.
  // Use `npm run build:check` (sets NEXT_DIST_DIR) whenever dev is running.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
