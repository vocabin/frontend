"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { statsApi } from "@/lib/api";

const NAV_ITEMS = [
  {
    href: "/",
    label: "홈",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/words",
    label: "단어 세트",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    href: "/stats",
    label: "학습 통계",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  const [indicator, setIndicator] = useState({ top: 0, height: 40, opacity: 0 });
  const [streak, setStreak] = useState<number | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const activeMainIndex = NAV_ITEMS.findIndex((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );
  const isSettingsActive = pathname.startsWith("/settings");

  useEffect(() => {
    statsApi.getSummary()
      .then((res) => setStreak(res.data.streakDays))
      .catch(() => setStreak(5)); // Failsafe dummy
  }, [pathname]);

  useEffect(() => {
    const activeTheme = document.documentElement.classList.contains("light") ? "light" : "dark";
    setTheme(activeTheme);
  }, []);

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

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    }
  };

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-60 z-40 border-r border-border bg-card/85 backdrop-blur-xl transition-all duration-300">
      {/* 로고 */}
      <div className="px-6 py-6 border-b border-border">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center p-1.5 shadow-md shadow-primary/20 transition-transform duration-300 group-hover:rotate-6">
            <img 
              src="/icon.svg" 
              alt="" 
              className="w-full h-full object-contain" 
              style={{ filter: "var(--logo-filter)" }}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold text-foreground tracking-tight leading-none">Vocabin</span>
            <span className="text-[10px] text-muted mt-1 font-semibold tracking-wider">SMART REVIEW</span>
          </div>
        </Link>
      </div>

      {/* 네비게이션 */}
      <nav ref={navRef} className="flex-1 px-3 py-6 relative">
        {/* 슬라이딩 인디케이터 */}
        {activeMainIndex >= 0 && (
          <div
            className="absolute left-3 right-3 border-l-2 border-primary rounded-r-lg pointer-events-none"
            style={{
              top: indicator.top,
              height: indicator.height,
              opacity: indicator.opacity,
              backgroundColor: "var(--nav-indicator-bg)",
              transition: "top 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.15s ease",
            }}
          />
        )}

        <div className="space-y-1">
          {NAV_ITEMS.map((item, i) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                ref={(el) => { itemRefs.current[i] = el; }}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? "text-primary bg-primary/[0.02]" 
                    : "text-muted hover:text-foreground hover:bg-primary/[0.02]"
                }`}
              >
                <span className={`transition-transform duration-250 ${isActive ? "scale-110" : ""}`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 스트릭 위젯 */}
      {streak !== null && (
        <div className="px-4 mb-4">
          <div 
            className="border border-border rounded-2xl p-4 flex items-center gap-3.5 shadow-sm transition-colors duration-300"
            style={{ backgroundColor: "var(--streak-bg)" }}
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-xl shrink-0">
              🔥
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-sub font-bold tracking-wider uppercase">Streak</p>
              <p className="text-sm font-extrabold text-foreground mt-0.5 leading-none">{streak}일 연속 학습 중</p>
            </div>
          </div>
        </div>
      )}

      {/* 설정 및 테마 전환 */}
      <div className="px-3 py-4 border-t border-border flex items-center gap-2">
        <Link
          href="/settings"
          className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
            isSettingsActive
              ? "bg-primary/10 text-primary border-l-2 border-primary rounded-l-none"
              : "text-muted hover:text-foreground hover:bg-primary/[0.02]"
          }`}
        >
          <span className={`transition-transform duration-200 ${isSettingsActive ? "scale-110" : ""}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          설정
        </Link>
        
        <button
          onClick={toggleTheme}
          type="button"
          className="p-3 bg-white/[0.02] hover:bg-primary/[0.04] border border-border text-muted hover:text-foreground rounded-lg transition-all spring-active cursor-pointer"
          title={theme === "dark" ? "라이트 모드로 변경" : "다크 모드로 변경"}
        >
          {theme === "dark" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
      </div>
    </aside>
  );
}
