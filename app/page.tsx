"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { statsApi, wordSetsApi, StatsSummary, WordSetProgress } from "@/lib/api";

function IconCards() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function IconZap() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function HomePage() {
  const [progress, setProgress] = useState<WordSetProgress[]>([]);
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const failsafe = setTimeout(() => setLoading(false), 8000);
    Promise.all([wordSetsApi.getProgress(), statsApi.getSummary()])
      .then(([progressRes, summaryRes]) => {
        setProgress(progressRes.data);
        setSummary(summaryRes.data);
      })
      .catch(() => {})
      .finally(() => { clearTimeout(failsafe); setLoading(false); });
    return () => clearTimeout(failsafe);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-5 pt-10 pb-6">
      <div className="md:grid md:grid-cols-[300px_1fr] md:gap-10 md:items-start">

        {/* ── 왼쪽: 헤더 + 통계 + 학습 모드 ────────────────────── */}
        <div>
          <div className="mb-8">
            <h1 className="text-[22px] font-bold text-foreground leading-tight">안녕하세요 👋</h1>
            <p className="text-slate-500 text-sm mt-1.5">오늘도 꾸준히 학습해봐요</p>
          </div>

          {/* 통계 수평 한 줄 */}
          {summary && (
            <div className="flex items-stretch bg-card border border-white/[0.06] rounded-2xl overflow-hidden mb-8">
              <div className="flex-1 py-5 text-center">
                <p className="text-2xl font-bold text-foreground tabular-nums">{summary.totalWords}</p>
                <p className="text-[11px] text-slate-500 mt-1">전체 단어</p>
              </div>
              <div className="w-px bg-white/[0.06]" />
              <div className="flex-1 py-5 text-center">
                <p className="text-2xl font-bold text-primary tabular-nums">{Math.round(summary.correctRate * 100)}%</p>
                <p className="text-[11px] text-slate-500 mt-1">정답률</p>
              </div>
              <div className="w-px bg-white/[0.06]" />
              <div className="flex-1 py-5 text-center">
                <p className="text-2xl font-bold text-foreground tabular-nums">{summary.streakDays}</p>
                <p className="text-[11px] text-slate-500 mt-1">연속 학습일</p>
              </div>
            </div>
          )}

          {/* 학습 모드 */}
          <p className="text-xs font-semibold text-slate-500 mb-3">학습 모드</p>
          <div className="space-y-2 mb-10 md:mb-0">
            <Link href="/study/flashcard" className="flex items-center gap-4 bg-card border border-white/[0.06] rounded-2xl px-4 py-4 hover:border-white/[0.12] hover:bg-white/[0.04] transition-all group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/[0.12] flex items-center justify-center text-blue-400 shrink-0">
                <IconCards />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">플래시카드</p>
                <p className="text-xs text-slate-500 mt-0.5">SM-2 알고리즘 복습</p>
              </div>
              <span className="text-slate-600 group-hover:text-slate-400 transition-colors"><IconChevronRight /></span>
            </Link>

            <Link href="/study/speedrun" className="flex items-center gap-4 bg-card border border-white/[0.06] rounded-2xl px-4 py-4 hover:border-white/[0.12] hover:bg-white/[0.04] transition-all group">
              <div className="w-10 h-10 rounded-xl bg-orange-500/[0.12] flex items-center justify-center text-orange-400 shrink-0">
                <IconZap />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">스피드런</p>
                <p className="text-xs text-slate-500 mt-0.5">60초 타임어택</p>
              </div>
              <span className="text-slate-600 group-hover:text-slate-400 transition-colors"><IconChevronRight /></span>
            </Link>
          </div>
        </div>

        {/* ── 오른쪽: 단어 세트 리스트 ──────────────────────────── */}
        <div>
          {progress.length === 0 ? (
            <div className="text-center py-20 bg-card border border-white/[0.06] rounded-2xl mt-8 md:mt-0">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700 mx-auto mb-4">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <p className="text-sm font-medium text-slate-400">아직 단어 세트가 없어요</p>
              <p className="text-xs text-slate-600 mt-1 mb-5">CSV 파일을 업로드해서 시작해봐요</p>
              <Link href="/words/upload" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-hover transition-colors">
                첫 번째 세트 만들기
              </Link>
            </div>
          ) : (
            <div className="bg-card border border-white/[0.06] rounded-2xl overflow-hidden mt-8 md:mt-0">
              {/* 헤더 */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.05]">
                <p className="text-xs font-semibold text-slate-500">
                  단어 세트 <span className="text-slate-300 font-bold">{progress.length}</span>개
                </p>
                <Link href="/words/upload" className="flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80 transition-opacity">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  새 세트
                </Link>
              </div>

              {/* 리스트 */}
              <div className="divide-y divide-white/[0.04]">
                {progress.map((set) => {
                  const pct = set.totalWords > 0 ? Math.round((set.studiedWords / set.totalWords) * 100) : 0;
                  return (
                    <Link
                      key={set.wordSetId}
                      href={`/words/${set.wordSetId}`}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* 이름 + 단어 수 */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {set.name}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {set.studiedWords} / {set.totalWords}단어
                        </p>
                      </div>

                      {/* 진행률 */}
                      <div className="w-28 shrink-0 hidden sm:block">
                        <div className="h-1 bg-white/[0.07] rounded-full">
                          <div
                            className="h-1 bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* % */}
                      <span className="text-xs font-bold text-primary tabular-nums w-8 text-right shrink-0">
                        {pct}%
                      </span>

                      {/* 화살표 */}
                      <span className="text-slate-700 group-hover:text-slate-400 transition-colors shrink-0">
                        <IconChevronRight />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
