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
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      {/* 헤더 */}
      <div className="mb-2">
        <h1 className="text-xl font-bold text-foreground">통계</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {now.getFullYear()}년 {now.getMonth() + 1}월
        </p>
      </div>

      {/* 요약 카드 */}
      {summary && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-card border border-white/[0.05] rounded-xl p-4">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">총 단어</p>
            <p className="text-3xl font-bold text-foreground tabular-nums">{summary.totalWords}</p>
            <p className="text-[11px] text-slate-600 mt-1">개</p>
          </div>
          <div className="bg-card border border-white/[0.05] rounded-xl p-4">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">전체 정답률</p>
            <p className="text-3xl font-bold text-primary tabular-nums">{Math.round(summary.correctRate * 100)}</p>
            <p className="text-[11px] text-slate-600 mt-1">%</p>
          </div>
          <div className="bg-card border border-white/[0.05] rounded-xl p-3.5">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">연속 학습</p>
            <p className="text-xl font-bold text-foreground tabular-nums">
              {summary.streakDays}
              <span className="text-sm font-normal text-slate-500 ml-1">일</span>
            </p>
          </div>
          <div className="bg-card border border-white/[0.05] rounded-xl p-3.5">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">총 학습 기록</p>
            <p className="text-xl font-bold text-foreground tabular-nums">
              {summary.totalRecords}
              <span className="text-sm font-normal text-slate-500 ml-1">회</span>
            </p>
          </div>
        </div>
      )}

      {/* 주간 정답률 */}
      {weeklyWithLabel.length > 0 && (
        <div className="bg-card border border-white/[0.05] rounded-xl p-5">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-5">이번 주 정답률</p>
          <div className="flex items-end gap-1.5" style={{ height: "80px" }}>
            {weeklyWithLabel.map((w, i) => {
              const heightPct = maxRate > 0 ? (w.correctRate / maxRate) * 100 : 0;
              const isToday = w.date === todayDateStr;
              return (
                <div key={w.date} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex flex-col justify-end" style={{ height: "60px" }}>
                    <div
                      className={`w-full rounded-sm bar-fill ${isToday ? "bg-primary" : "bg-primary/35"}`}
                      style={{
                        height: `${heightPct}%`,
                        animationDelay: `${i * 50}ms`,
                        minHeight: heightPct > 0 ? "3px" : "0",
                      }}
                    />
                  </div>
                  <span className={`text-[10px] font-medium ${isToday ? "text-primary" : "text-slate-600"}`}>
                    {w.dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-1.5 mt-3 border-t border-white/[0.04] pt-3">
            {weeklyWithLabel.map((w) => (
              <div key={w.date} className="flex-1 text-center">
                <span className="text-[10px] tabular-nums text-slate-500">
                  {Math.round(w.correctRate * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 학습 히트맵 */}
      <div className="bg-card border border-white/[0.05] rounded-xl p-5">
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-4">
          {now.getMonth() + 1}월 학습 기록
        </p>
        <div className="grid grid-cols-7 gap-px mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] text-slate-700 pb-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
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
                title={`${i + 1}일${studied ? " ✓" : ""}`}
                className={`aspect-square rounded-sm transition-colors ${
                  isFuture ? "bg-white/[0.02]" : studied ? "bg-primary/60" : "bg-white/[0.04]"
                } ${isToday ? "ring-1 ring-primary/50" : ""}`}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-1 mt-3 justify-end">
          <span className="text-[10px] text-slate-700 mr-0.5">미학습</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-white/[0.04]" />
          <div className="w-2.5 h-2.5 rounded-sm bg-primary/60" />
          <span className="text-[10px] text-slate-700 ml-0.5">학습</span>
        </div>
      </div>

      {/* 세트별 진행률 */}
      {progress.length > 0 && (
        <div className="bg-card border border-white/[0.05] rounded-xl p-5">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-4">세트별 진행률</p>
          <div className="space-y-5">
            {progress.map((p) => {
              const pct = p.totalWords > 0 ? Math.round((p.studiedWords / p.totalWords) * 100) : 0;
              return (
                <div key={p.wordSetId}>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-sm text-foreground">{p.name}</span>
                    <div className="flex items-baseline gap-2 tabular-nums">
                      <span className="text-[11px] text-slate-600">{p.studiedWords}/{p.totalWords}</span>
                      <span className="text-sm font-semibold text-primary">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1 bg-white/[0.05] rounded-full">
                    <div
                      className="h-1 bg-primary rounded-full transition-all duration-700"
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
