"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import type { ReactNode } from "react";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";

/**
 * Desktop sidebar / mobile bottom-tab-bar, per WEB_PLAN.md §2.2 and §4 — the persistent
 * shell that replaces the mobile app's bottom nav on wide viewports. Nav items and
 * icons are ported directly from the bottom nav in `Dashboard.dc.html` (Home, Planner,
 * Chapters, Timer, plus the centre FAB) rather than invented, so this matches the
 * design's actual navigation rather than a guess at what it should contain.
 */
/** The real mobile bottom nav (from `Dashboard.dc.html`) — Home, Planner, Chapters,
 *  Timer, plus the centre FAB. Kept to exactly these four on mobile. */
const MOBILE_NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: HomeIcon },
  { href: "/planner", label: "Planner", icon: PlannerIcon },
  { href: "/syllabus", label: "Chapters", icon: ChaptersIcon },
  { href: "/timer", label: "Timer", icon: TimerIcon },
] as const;

/** Desktop has room for more than four destinations (WEB_PLAN.md §2.2) — Stats is
 *  desktop-only rather than crowding the mobile bar past its real four-tab design. */
const DESKTOP_NAV_ITEMS = [
  ...MOBILE_NAV_ITEMS,
  { href: "/stats", label: "Stats", icon: StatsIcon },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-bg lg:flex">
      {/* ---- Desktop sidebar ---- */}
      <aside className="hidden w-60 flex-none flex-col border-r border-border bg-surface lg:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[9px]" style={{ background: "var(--primary)" }}>
            <TimerIcon className="h-5 w-5" stroke="var(--primary-on)" />
          </span>
          <span className="text-[16px] font-extrabold tracking-[-0.01em] text-text">Study Counter</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          {DESKTOP_NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-[10px] text-label font-semibold transition-colors duration-150",
                  active ? "bg-primary/10 text-primary" : "text-dim hover:bg-surface2 hover:text-text",
                )}
                style={active ? { backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" } : undefined}
              >
                <Icon className="h-5 w-5" stroke={active ? "var(--primary)" : "currentColor"} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-3 border-t border-border p-3">
          <Link
            href="/settings"
            className={clsx(
              "flex items-center gap-3 rounded-xl px-3 py-[10px] text-label font-semibold transition-colors duration-150",
              pathname === "/settings" ? "text-primary" : "text-dim hover:bg-surface2 hover:text-text",
            )}
          >
            <SettingsIcon className="h-5 w-5" stroke={pathname === "/settings" ? "var(--primary)" : "currentColor"} />
            Settings
          </Link>
          <ThemeSwitcher />
        </div>
      </aside>

      {/* ---- Content ---- */}
      <div className="flex-1 pb-20 lg:pb-0">{children}</div>

      {/* ---- Mobile bottom tab bar ---- */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-border bg-surface px-2 pb-[env(safe-area-inset-bottom)] pt-2 lg:hidden">
        {MOBILE_NAV_ITEMS.slice(0, 2).map((item) => (
          <MobileTab key={item.href} item={item} active={pathname === item.href} />
        ))}
        <Link
          href="/timer"
          className="-mt-8 flex h-14 w-14 flex-none items-center justify-center rounded-full shadow-lg"
          style={{ background: "var(--primary)", boxShadow: "0 8px 20px color-mix(in srgb, var(--primary) 50%, transparent)" }}
          aria-label="Start studying"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--primary-on)" strokeWidth="2.6" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Link>
        {MOBILE_NAV_ITEMS.slice(2).map((item) => (
          <MobileTab key={item.href} item={item} active={pathname === item.href} />
        ))}
      </nav>
    </div>
  );
}

function MobileTab({
  item,
  active,
}: {
  item: (typeof MOBILE_NAV_ITEMS)[number];
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className="flex flex-1 flex-col items-center gap-1 py-1">
      <Icon className="h-[23px] w-[23px]" stroke={active ? "var(--primary)" : "var(--dim)"} />
      <span className="text-[10px] font-semibold" style={{ color: active ? "var(--primary)" : "var(--dim)" }}>
        {item.label}
      </span>
    </Link>
  );
}

type IconProps = { className?: string; stroke?: string };

function HomeIcon({ className, stroke = "currentColor" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
    </svg>
  );
}

function PlannerIcon({ className, stroke = "currentColor" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
    </svg>
  );
}

function ChaptersIcon({ className, stroke = "currentColor" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h12M8 12h12M8 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </svg>
  );
}

function TimerIcon({ className, stroke = "currentColor" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 13V9M9.5 2h5" />
    </svg>
  );
}

function StatsIcon({ className, stroke = "currentColor" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  );
}

function SettingsIcon({ className, stroke = "currentColor" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V19a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 6.6 17.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4 13H3.9a2 2 0 1 1 0-4H4a1.6 1.6 0 0 0 1.5-2.6l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 11 4.6V4a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.6 1.6 0 0 0 20 11h.1a2 2 0 1 1 0 4z" />
    </svg>
  );
}
