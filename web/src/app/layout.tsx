import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Self-hosted by next/font — no runtime request to Google, and no FOUT. Weights match
// the design system's usage (400 body → 800 countdown hero).
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Study Counter — CA study planner & tracker",
  description:
    "Track study hours, plan your attempt, and see whether you're on pace — built for Indian CA students, with the full ICAI syllabus preloaded.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" }],
  },
};

// Dark is the default theme (see globals.css) — matches the app default rather than
// following the OS scheme, since most usage here is deliberately late-night.
export const viewport: Viewport = {
  themeColor: "#0f111a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // Dark is the default theme; the switcher rewrites data-theme on this element.
    <html lang="en" data-theme="dark" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
