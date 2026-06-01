"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const NAV_ITEMS = [
  {
    href: "/",
    label: "홈",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/words",
    label: "단어",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    href: "/stats",
    label: "통계",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ top: 0, height: 32, opacity: 0 });

  const activeMainIndex = NAV_ITEMS.findIndex((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );
  const isSettingsActive = pathname.startsWith("/settings");

  useEffect(() => {
    const el = itemRefs.current[activeMainIndex];
    const nav = navRef.current;
    if (!el || !nav) return;
    const navRect = nav.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setIndicator({
      top: elRect.top - navRect.top,
      height: elRect.height,
      opacity: 1,
    });
  }, [activeMainIndex]);

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-56 bg-card z-40 border-r border-white/[0.05]">
      {/* 로고 */}
      <div className="px-5 pt-6 pb-5 border-b border-white/[0.05]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-6 h-6 rounded flex items-center justify-center overflow-hidden transition-transform duration-200 group-hover:scale-110">
            <img src="/icon.svg" alt="" className="w-full h-full object-cover" />
          </div>
          <span className="text-sm font-semibold text-foreground tracking-tight">Vocabin</span>
        </Link>
      </div>

      {/* 네비게이션 */}
      <nav ref={navRef} className="flex-1 px-2 py-3 relative">
        {/* 슬라이딩 인디케이터 */}
        {activeMainIndex >= 0 && (
          <div
            className="absolute left-2 right-2 bg-primary/10 rounded-md pointer-events-none"
            style={{
              top: indicator.top,
              height: indicator.height,
              opacity: indicator.opacity,
              transition: "top 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.15s ease",
            }}
          />
        )}

        <div className="space-y-px">
          {NAV_ITEMS.map((item, i) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                ref={(el) => { itemRefs.current[i] = el; }}
                className={`relative flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                  isActive ? "text-primary" : "text-slate-500 hover:text-slate-200"
                }`}
              >
                <span className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 설정 */}
      <div className="px-2 py-3 border-t border-white/[0.05]">
        <Link
          href="/settings"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 ${
            isSettingsActive
              ? "bg-primary/10 text-primary"
              : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.04]"
          }`}
        >
          <span className={`transition-transform duration-200 ${isSettingsActive ? "scale-110" : ""}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          설정
        </Link>
      </div>
    </aside>
  );
}
