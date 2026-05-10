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
        setSummary({ todayReviewCount: 24, weeklyCorrectRate: 71, streakDays: 5, totalWords: 135, totalSessions: 18, totalCorrectRate: 68 });
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

  const getHeatColor = (count: number | undefined) => {
    if (!count) return "bg-slate-800";
    if (count === 1) return "bg-primary/20";
    if (count === 2) return "bg-primary/40";
    if (count === 3) return "bg-primary/60";
    return "bg-primary";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">통계</h1>

      {/* 요약 카드 */}
      {summary && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "총 단어 수", value: `${summary.totalWords}개` },
            { label: "전체 정답률", value: `${summary.totalCorrectRate}%` },
            { label: "연속 학습", value: `${summary.streakDays}일` },
            { label: "총 세션 수", value: `${summary.totalSessions}회` },
          ].map((item) => (
            <div key={item.label} className="bg-card rounded-2xl p-4">
              <p className="text-2xl font-bold text-primary">{item.value}</p>
              <p className="text-xs text-slate-400 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* 주간 정답률 바 차트 */}
      <div className="bg-card rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">이번 주 정답률</h2>
        <div className="flex items-end justify-between gap-1.5 h-28">
          {weekly.map((w) => (
            <div key={w.day} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-medium">{w.correctRate}%</span>
              <div className="w-full bg-slate-700 rounded-t-md relative" style={{ height: "72px" }}>
                <div
                  className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-md transition-all duration-700"
                  style={{ height: `${(w.correctRate / 100) * 72}px` }}
                />
              </div>
              <span className="text-[10px] text-slate-500">{w.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 학습 히트맵 */}
      <div className="bg-card rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          {now.getFullYear()}년 {now.getMonth() + 1}월 학습 기록
        </h2>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] text-slate-500">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = String(i + 1).padStart(2, "0");
            const count = calendarMap.get(day);
            const isFuture = i + 1 > now.getDate();
            return (
              <div
                key={day}
                title={count ? `${i + 1}일: ${count}세션` : undefined}
                className={`aspect-square rounded-md ${isFuture ? "bg-slate-800/50" : getHeatColor(count)} transition-colors`}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-1.5 mt-3 justify-end">
          <span className="text-[10px] text-slate-500">적음</span>
          {["bg-slate-800", "bg-primary/20", "bg-primary/40", "bg-primary/60", "bg-primary"].map((c) => (
            <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span className="text-[10px] text-slate-500">많음</span>
        </div>
      </div>

      {/* 세트별 진행률 */}
      <div className="bg-card rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">세트별 진행률</h2>
        <div className="space-y-4">
          {progress.map((p) => {
            const pct = p.totalWords > 0 ? Math.round((p.learnedWords / p.totalWords) * 100) : 0;
            return (
              <div key={p.wordSetId}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-foreground">{p.wordSetName}</span>
                  <span className="text-xs text-slate-500">
                    {p.learnedWords}/{p.totalWords} · {p.correctRate}%
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full">
                  <div
                    className="h-2 bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
