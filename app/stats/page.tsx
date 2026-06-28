"use client";

import { useEffect, useState } from "react";
import { statsApi, wordSetsApi, StatsSummary, WeeklyDay, WordSetProgress } from "@/lib/api";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function StatsPage() {
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [weekly, setWeekly] = useState<WeeklyDay[]>([]);
  const [studiedDates, setStudiedDates] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<WordSetProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();

  useEffect(() => {
    Promise.all([
      statsApi.getSummary(),
      statsApi.getWeekly(),
      statsApi.getCalendar(now.getFullYear(), now.getMonth() + 1),
      wordSetsApi.getProgress(),
    ])
      .then(([s, w, c, p]) => {
        setSummary(s.data);
        setWeekly(w.data.days ?? []);
        setStudiedDates(new Set(c.data.studiedDates ?? []));
        setProgress(p.data);
      })
      .catch(() => {
        setSummary({ totalWords: 135, correctRate: 0.71, streakDays: 5, totalRecords: 18 });
        const dummyDays: WeeklyDay[] = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(now);
          d.setDate(now.getDate() - 6 + i);
          return {
            date: d.toISOString().slice(0, 10),
            total: Math.floor(Math.random() * 20) + 5,
            correct: Math.floor(Math.random() * 15) + 3,
            correctRate: 0.5 + Math.random() * 0.4,
          };
        });
        setWeekly(dummyDays);
        const dates: string[] = [];
        for (let d = 1; d <= now.getDate(); d++) {
          if (Math.random() > 0.4) {
            dates.push(
              `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
            );
          }
        }
        setStudiedDates(new Set(dates));
        setProgress([
          { wordSetId: 1, name: "Week 1 — 기초 어휘", totalWords: 40, studiedWords: 32 },
          { wordSetId: 2, name: "Week 2 — 중급 어휘", totalWords: 50, studiedWords: 18 },
          { wordSetId: 3, name: "Week 3 — 고급 어휘", totalWords: 45, studiedWords: 5 },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(now.getFullYear(), now.getMonth(), 1).getDay();

  const weeklyWithLabel = weekly.map((w) => ({
    ...w,
    dayLabel: DAYS[new Date(w.date).getDay()],
  }));
  const maxRate = weeklyWithLabel.length > 0 ? Math.max(...weeklyWithLabel.map((w) => w.correctRate)) : 1;
  const todayDateStr = now.toISOString().slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 page-in space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">학습 통계</h1>
        <p className="text-xs text-slate-400 mt-2 font-medium">
          {now.getFullYear()}년 {now.getMonth() + 1}월의 전체 학습 흐름 분석
        </p>
      </div>

      {/* 요약 카드 */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger">
          <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:border-white/10">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">총 단어 수</p>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-extrabold text-foreground tabular-nums num-pop tracking-tight">{summary.totalWords}</p>
              <span className="text-xs text-slate-400 font-medium">개</span>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:border-white/10">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">전체 정답률</p>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-extrabold text-primary tabular-nums num-pop tracking-tight">{Math.round(summary.correctRate * 100)}</p>
              <span className="text-xs text-slate-400 font-medium">%</span>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:border-white/10">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">현재 스트릭</p>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-extrabold text-orange-400 tabular-nums num-pop tracking-tight">{summary.streakDays}</p>
              <span className="text-xs text-slate-400 font-medium">일</span>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:border-white/10">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">총 복습 횟수</p>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-extrabold text-foreground tabular-nums num-pop tracking-tight">{summary.totalRecords}</p>
              <span className="text-xs text-slate-400 font-medium">회</span>
            </div>
          </div>
        </div>
      )}

      {/* 주간 정답률 */}
      {weeklyWithLabel.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm font-bold text-foreground mb-6 tracking-tight">이번 주 일별 정답률</p>
          <div className="flex items-end gap-3 sm:gap-4 h-32 px-2">
            {weeklyWithLabel.map((w, i) => {
              const heightPct = maxRate > 0 ? (w.correctRate / maxRate) * 100 : 0;
              const isToday = w.date === todayDateStr;
              return (
                <div key={w.date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col justify-end h-24 relative group">
                    {/* Hover tooltip */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/[0.08] text-[9px] font-semibold text-slate-300 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                      {Math.round(w.correctRate * 100)}%
                    </div>
                    <div
                      className={`w-full rounded-full bar-fill transition-all duration-300 ${
                        isToday 
                          ? "bg-gradient-to-t from-primary to-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.3)]" 
                          : "bg-primary/20 hover:bg-primary/40 border border-primary/10"
                      }`}
                      style={{
                        height: `${Math.max(8, heightPct)}%`,
                        animationDelay: `${i * 40}ms`,
                      }}
                    />
                  </div>
                  <span className={`text-xs font-semibold ${isToday ? "text-primary" : "text-slate-400"}`}>
                    {w.dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 sm:gap-4 mt-4 border-t border-white/[0.04] pt-4 px-2">
            {weeklyWithLabel.map((w) => (
              <div key={w.date} className="flex-1 text-center">
                <span className="text-[10px] font-bold tabular-nums text-slate-500">
                  {Math.round(w.correctRate * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 학습 히트맵 */}
      <div className="glass-card rounded-2xl p-6">
        <p className="text-sm font-bold text-foreground mb-5 tracking-tight">
          {now.getMonth() + 1}월 일별 학습 현황
        </p>
        <div className="grid grid-cols-7 gap-px mb-2 text-center">
          {DAYS.map((d) => (
            <div key={d} className="text-[10px] font-bold text-slate-500 pb-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`e-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayStr = String(i + 1).padStart(2, "0");
            const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${dayStr}`;
            const studied = studiedDates.has(dateStr);
            const isFuture = i + 1 > now.getDate();
            const isToday = i + 1 === now.getDate();
            return (
              <div
                key={dayStr}
                title={`${now.getMonth() + 1}월 ${i + 1}일${studied ? " (학습 완료)" : " (미학습)"}`}
                className={`aspect-square rounded-lg transition-all duration-200 cursor-pointer ${
                  isFuture 
                    ? "bg-white/[0.01] border border-white/[0.02] cursor-default" 
                    : studied 
                      ? "bg-gradient-to-tr from-primary to-blue-400 shadow-[0_0_4px_rgba(59,130,246,0.25)] hover:scale-105" 
                      : "bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.06]"
                } ${isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-2.5 mt-5 justify-end">
          <span className="text-[10px] font-bold text-slate-500">Less</span>
          <div className="w-3 h-3 rounded bg-white/[0.03] border border-white/[0.04]" />
          <div className="w-3 h-3 rounded bg-gradient-to-tr from-primary to-blue-400" />
          <span className="text-[10px] font-bold text-slate-500">More</span>
        </div>
      </div>

      {/* 세트별 진행률 */}
      {progress.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <p className="text-sm font-bold text-foreground mb-5 tracking-tight">세트별 완수 상태</p>
          <div className="space-y-6">
            {progress.map((p) => {
              const pct = p.totalWords > 0 ? Math.round((p.studiedWords / p.totalWords) * 100) : 0;
              return (
                <div key={p.wordSetId}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-foreground truncate max-w-[70%]">{p.name}</span>
                    <div className="flex items-baseline gap-2 tabular-nums shrink-0">
                      <span className="text-[10px] font-semibold text-slate-400">{p.studiedWords}/{p.totalWords} 단어</span>
                      <span className="text-sm font-extrabold text-primary">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-white/[0.03] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-700 shadow-[0_0_6px_rgba(59,130,246,0.2)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
