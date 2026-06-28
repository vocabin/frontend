"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { statsApi, wordSetsApi, StatsSummary, WordSetProgress } from "@/lib/api";

function IconBook() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconFlame() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function IconCards() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function IconZap() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
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
      .catch(() => {
        // 백엔드가 실행 중이지 않을 때를 위한 프리미엄 더미 데이터 로드
        setSummary({ totalWords: 135, correctRate: 0.71, streakDays: 5, totalRecords: 18 });
        setProgress([
          { wordSetId: 1, name: "Week 1 — 기초 어휘", totalWords: 40, studiedWords: 32 },
          { wordSetId: 2, name: "Week 2 — 중급 어휘", totalWords: 50, studiedWords: 18 },
          { wordSetId: 3, name: "Week 3 — 고급 어휘", totalWords: 45, studiedWords: 5 }
        ]);
      })
      .finally(() => {
        clearTimeout(failsafe);
        setLoading(false);
      });

    return () => clearTimeout(failsafe);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 page-in">
      {/* 헤더 */}
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">안녕하세요 👋</h1>
          <p className="text-slate-400 mt-2 text-sm font-medium">오늘도 꾸준하게 단어 복습을 이어가 볼까요?</p>
        </div>
      </div>

      {/* 통계 요약 카드 */}
      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-10 stagger">
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:border-primary/20 group">
            <div className="absolute -right-3 -bottom-3 text-foreground opacity-[0.05] group-hover:scale-110 transition-transform duration-300">
              <IconBook />
            </div>
            <div className="text-blue-400 mb-3"><IconBook /></div>
            <p className="text-2xl font-bold text-foreground tabular-nums num-pop tracking-tight">{summary.totalWords}</p>
            <p className="text-xs text-muted mt-1 font-semibold">전체 단어</p>
          </div>
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:border-primary/20 group">
            <div className="absolute -right-3 -bottom-3 text-foreground opacity-[0.05] group-hover:scale-110 transition-transform duration-300">
              <IconCheck />
            </div>
            <div className="text-correct mb-3"><IconCheck /></div>
            <p className="text-2xl font-bold text-foreground tabular-nums num-pop tracking-tight">{Math.round(summary.correctRate * 100)}%</p>
            <p className="text-xs text-muted mt-1 font-semibold">전체 정답률</p>
          </div>
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:border-primary/20 group">
            <div className="absolute -right-3 -bottom-3 text-foreground opacity-[0.05] group-hover:scale-110 transition-transform duration-300">
              <IconFlame />
            </div>
            <div className="text-orange-400 mb-3"><IconFlame /></div>
            <p className="text-2xl font-bold text-foreground tabular-nums num-pop tracking-tight">{summary.streakDays}일</p>
            <p className="text-xs text-muted mt-1 font-semibold">연속 학습일</p>
          </div>
        </div>
      )}

      {/* 전체 학습 모드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <Link 
          href="/study/flashcard" 
          className="glass-card rounded-2xl p-6 transition-all duration-300 hover:border-primary/30 hover:bg-primary/[0.02] group spring-active"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 transition-colors duration-300 group-hover:bg-blue-500/20">
              <IconCards />
            </div>
            <div>
              <p className="text-base font-bold text-foreground tracking-tight flex items-center gap-1.5">
                플래시카드
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full font-medium">SM-2 복습</span>
              </p>
              <p className="text-xs text-muted mt-1.5 leading-relaxed">
                망각 곡선 주기에 맞춰 최적의 단어들만 복습합니다.
              </p>
            </div>
          </div>
        </Link>
        <Link 
          href="/study/speedrun" 
          className="glass-card rounded-2xl p-6 transition-all duration-300 hover:border-orange-500/30 hover:bg-orange-500/[0.02] group spring-active"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 transition-colors duration-300 group-hover:bg-orange-500/20">
              <IconZap />
            </div>
            <div>
              <p className="text-base font-bold text-foreground tracking-tight flex items-center gap-1.5">
                스피드런
                <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full font-medium">Time Attack</span>
              </p>
              <p className="text-xs text-muted mt-1.5 leading-relaxed">
                60초 동안 빠르고 격렬하게 단어 스펠링을 맞춰보세요.
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* 세트별 진행률 */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-foreground tracking-tight">내 단어 세트</h2>
        <Link href="/words/upload" className="text-sm text-primary font-semibold hover:text-blue-400 hover:underline transition-colors">
          + 새 세트 업로드
        </Link>
      </div>

      <div className="space-y-4 stagger">
        {progress.map((set) => {
          const pct = set.totalWords > 0 ? Math.round((set.studiedWords / set.totalWords) * 100) : 0;
          return (
            <div key={set.wordSetId} className="glass-card rounded-2xl p-6 transition-all duration-300 hover:border-primary/20">
              <div className="flex items-start justify-between mb-4">
                <Link href={`/words/${set.wordSetId}`} className="flex-1 min-w-0 group">
                  <h3 className="font-bold text-foreground text-[15px] group-hover:text-primary transition-colors truncate tracking-tight">{set.name}</h3>
                  <p className="text-xs text-muted mt-1 font-semibold">
                    총 {set.totalWords}단어 중 {set.studiedWords}개 학습 완료
                  </p>
                </Link>
                <span className="text-base font-extrabold text-primary tabular-nums tracking-tight ml-2">{pct}%</span>
              </div>

              {/* 프로그레스 바 */}
              <div className="h-2 bg-border rounded-full mb-5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* 행동 버튼 */}
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href={`/words/${set.wordSetId}`}
                  className="block text-center py-3 bg-background border border-border hover:bg-primary/[0.03] text-muted hover:text-foreground text-xs font-semibold rounded-xl spring-active transition-all"
                >
                  단어 목록
                </Link>
                <Link
                  href={`/study/weak?wordSetId=${set.wordSetId}`}
                  className="block text-center py-3 bg-background border border-border hover:bg-primary/[0.03] text-muted hover:text-foreground text-xs font-semibold rounded-xl spring-active transition-all"
                >
                  취약 단어
                </Link>
              </div>
            </div>
          );
        })}

        {progress.length === 0 && (
          <div className="glass-card rounded-2xl text-center py-16 text-slate-500">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700 mx-auto mb-4">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <p className="text-sm font-semibold text-slate-400">등록된 단어 세트가 아직 없습니다</p>
            <p className="text-xs text-slate-500 mt-1">파일을 업로드하여 첫 번째 단어 세트를 생성해보세요.</p>
            <Link href="/words/upload" className="mt-5 inline-block text-sm bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-hover shadow-md shadow-primary/20 transition-all spring-active">
              첫 번째 세트 만들기 →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
