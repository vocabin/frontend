"use client";

import { useEffect, useState } from "react";
import { statsApi, wordSetsApi, StatsSummary, WeeklyStats, CalendarEntry, WordSetProgress } from "@/lib/api";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function StatsPage() {
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [weekly, setWeekly] = useState<WeeklyStats[]>([]);
  const [calendar, setCalendar] = useState<CalendarEntry[]>([]);
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
        setWeekly(w.data);
        setCalendar(c.data);
        setProgress(p.data);
      })
      .catch(() => {
        setSummary({ todayReviewCount: 24, weeklyCorrectRate: 71, streakDays: 5, totalWords: 135, totalSessions: 18, totalCorrectRate: 68, weakWordCount: 8 });
        setWeekly([
          { day: "월", correctRate: 60 },
          { day: "화", correctRate: 75 },
          { day: "수", correctRate: 55 },
          { day: "목", correctRate: 88 },
          { day: "금", correctRate: 72 },
          { day: "토", correctRate: 90 },
          { day: "일", correctRate: 65 },
        ]);
        const entries: CalendarEntry[] = [];
        for (let d = 1; d <= now.getDate(); d++) {
          if (Math.random() > 0.4) {
            entries.push({
              date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
              sessionCount: Math.floor(Math.random() * 4) + 1,
            });
          }
        }
        setCalendar(entries);
        setProgress([
          { wordSetId: 1, wordSetName: "Week 1 — 기초 어휘", totalWords: 40, learnedWords: 32, correctRate: 80 },
          { wordSetId: 2, wordSetName: "Week 2 — 중급 어휘", totalWords: 50, learnedWords: 18, correctRate: 62 },
          { wordSetId: 3, wordSetName: "Week 3 — 고급 어휘", totalWords: 45, learnedWords: 5, correctRate: 40 },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const calendarMap = new Map(calendar.map((c) => [c.date.split("-")[2], c.sessionCount]));
  const maxRate = weekly.length > 0 ? Math.max(...weekly.map((w) => w.correctRate)) : 100;

  const getHeatStyle = (count: number | undefined): string => {
    if (!count) return "bg-white/[0.04]";
    if (count === 1) return "bg-primary/25";
    if (count === 2) return "bg-primary/45";
    if (count === 3) return "bg-primary/65";
    return "bg-primary";
  };

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

      {/* 요약 — 상단 2개 큰 카드 + 하단 2개 */}
      {summary && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-card border border-white/[0.05] rounded-xl p-4">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">총 단어</p>
            <p className="text-3xl font-bold text-foreground tabular-nums">{summary.totalWords}</p>
            <p className="text-[11px] text-slate-600 mt-1">개</p>
          </div>
          <div className="bg-card border border-white/[0.05] rounded-xl p-4">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">전체 정답률</p>
            <p className="text-3xl font-bold text-primary tabular-nums">{summary.totalCorrectRate}</p>
            <p className="text-[11px] text-slate-600 mt-1">%</p>
          </div>
          <div className="bg-card border border-white/[0.05] rounded-xl p-3.5">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">연속 학습</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{summary.streakDays}<span className="text-sm font-normal text-slate-500 ml-1">일</span></p>
          </div>
          <div className="bg-card border border-white/[0.05] rounded-xl p-3.5">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">총 세션</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{summary.totalSessions}<span className="text-sm font-normal text-slate-500 ml-1">회</span></p>
          </div>
        </div>
      )}

      {/* 주간 정답률 */}
      <div className="bg-card border border-white/[0.05] rounded-xl p-5">
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-5">이번 주 정답률</p>
        <div className="flex items-end gap-1.5" style={{ height: "80px" }}>
          {weekly.map((w, i) => {
            const heightPct = maxRate > 0 ? (w.correctRate / maxRate) * 100 : 0;
            const isToday = DAYS[now.getDay()] === w.day;
            return (
              <div key={w.day} className="flex-1 flex flex-col items-center gap-1.5">
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
                  {w.day}
                </span>
              </div>
            );
          })}
        </div>
        {/* 정답률 레이블 */}
        <div className="flex gap-1.5 mt-3 border-t border-white/[0.04] pt-3">
          {weekly.map((w) => (
            <div key={w.day} className="flex-1 text-center">
              <span className="text-[10px] tabular-nums text-slate-500">{w.correctRate}%</span>
            </div>
          ))}
        </div>
      </div>

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
            const count = calendarMap.get(dayStr);
            const isFuture = i + 1 > now.getDate();
            const isToday = i + 1 === now.getDate();
            return (
              <div
                key={dayStr}
                title={count ? `${i + 1}일: ${count}세션` : `${i + 1}일`}
                className={`aspect-square rounded-sm transition-colors relative ${
                  isFuture ? "bg-white/[0.02]" : getHeatStyle(count)
                } ${isToday ? "ring-1 ring-primary/50" : ""}`}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-1 mt-3 justify-end">
          <span className="text-[10px] text-slate-700 mr-0.5">적음</span>
          {["bg-white/[0.04]", "bg-primary/25", "bg-primary/45", "bg-primary/65", "bg-primary"].map((c, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-sm ${c}`} />
          ))}
          <span className="text-[10px] text-slate-700 ml-0.5">많음</span>
        </div>
      </div>

      {/* 세트별 진행률 */}
      {progress.length > 0 && (
        <div className="bg-card border border-white/[0.05] rounded-xl p-5">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-4">세트별 진행률</p>
          <div className="space-y-5">
            {progress.map((p) => {
              const pct = p.totalWords > 0 ? Math.round((p.learnedWords / p.totalWords) * 100) : 0;
              return (
                <div key={p.wordSetId}>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-sm text-foreground">{p.wordSetName}</span>
                    <div className="flex items-baseline gap-2 tabular-nums">
                      <span className="text-[11px] text-slate-600">{p.learnedWords}/{p.totalWords}</span>
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
