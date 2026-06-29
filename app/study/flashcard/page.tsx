"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { wordsApi, studyApi, settingsApi, Word } from "@/lib/api";
import Portal from "@/components/Portal";

const DUMMY_WORDS: Word[] = [
  { id: 1, english: "abandon",    korean: "포기하다, 버리다",    wordSetId: 1 },
  { id: 2, english: "abstract",   korean: "추상적인; 요약하다",  wordSetId: 1 },
  { id: 3, english: "accelerate", korean: "가속하다",            wordSetId: 1 },
  { id: 4, english: "accumulate", korean: "축적하다",            wordSetId: 1 },
  { id: 5, english: "benevolent", korean: "자애로운, 친절한",    wordSetId: 1 },
];

type AnimState = "idle" | "exit" | "enter";
type LangMode = "en-ko" | "ko-en";

export default function FlashcardPage() {
  const router = useRouter();

  const [words, setWords]         = useState<Word[]>([]);
  const [index, setIndex]         = useState(0);
  const [flipped, setFlipped]     = useState(false);
  const [loading, setLoading]     = useState(true);
  const [finished, setFinished]   = useState(false);
  const [results, setResults]     = useState({ correct: 0, wrong: 0 });
  const [animState, setAnimState] = useState<AnimState>("idle");
  const [langMode, setLangMode]   = useState<LangMode>("en-ko");
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [editEnglish, setEditEnglish] = useState("");
  const [editKorean, setEditKorean]   = useState("");

  const loadWords = useCallback(() => {
    setLoading(true);
    setIndex(0); setFlipped(false); setFinished(false);
    setResults({ correct: 0, wrong: 0 }); setAnimState("idle");
    Promise.all([wordsApi.getDue(), settingsApi.get()])
      .then(([wordsRes, settingsRes]) => {
        const limit = settingsRes.data.dailyGoal ?? 20;
        setWords(wordsRes.data.slice(0, limit));
      })
      .catch(() => setWords(DUMMY_WORDS))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadWords(); }, [loadWords]);

  const goNext = useCallback(async (correct: boolean) => {
    if (animState !== "idle") return;
    const word = words[index];
    studyApi.recordResult({ wordId: word.id, correct, mode: "FLASHCARD" }).catch(() => {});
    setResults((r) => ({ correct: r.correct + (correct ? 1 : 0), wrong: r.wrong + (correct ? 0 : 1) }));

    setAnimState("exit");
    setTimeout(() => {
      if (index + 1 >= words.length) { setFinished(true); setAnimState("idle"); return; }
      setIndex((i) => i + 1);
      setFlipped(false);
      setAnimState("enter");
      setTimeout(() => setAnimState("idle"), 180);
    }, 140);
  }, [animState, words, index]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingWord) return;
      if (e.key === " " || e.key === "ArrowUp") { e.preventDefault(); setFlipped((f) => !f); }
      if (e.key === "ArrowRight" && flipped) goNext(true);
      if (e.key === "ArrowLeft"  && flipped) goNext(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flipped, editingWord, goNext]);

  const handleEditSave = async () => {
    if (!editingWord) return;
    wordsApi.update(editingWord.id, editEnglish, editKorean).catch(() => {});
    setWords((p) => p.map((w) => w.id === editingWord.id ? { ...w, english: editEnglish, korean: editKorean } : w));
    setEditingWord(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (words.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-6 py-12 flex flex-col items-center text-center page-in">
        <div className="glass-card rounded-3xl p-8 w-full text-center">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 className="text-lg font-extrabold text-foreground mb-1">학습할 단어가 없어요</h2>
          <p className="text-xs text-slate-500 mb-6">오늘 복습해야 할 단어가 없거나 단어장이 비어 있습니다. 새로운 세트 단어를 업로드해 보세요!</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/10 transition-all spring-active"
          >
            홈으로 가기
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    const total = results.correct + results.wrong;
    const rate  = total > 0 ? Math.round((results.correct / total) * 100) : 0;
    return (
      <div className="max-w-xl mx-auto px-6 py-12 flex flex-col items-center text-center page-in">
        <div className="w-20 h-20 rounded-full bg-slate-900 border border-white/[0.08] shadow-lg flex items-center justify-center mb-6">
          {rate >= 70 ? (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-correct">
              <circle cx="12" cy="12" r="10" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          ) : (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          )}
        </div>
        <h2 className="text-2xl font-extrabold text-foreground mb-2 tracking-tight">스마트 복습 완료!</h2>
        <p className="text-slate-400 text-sm mb-8 font-medium">오늘 계획된 {total}개의 단어 복습을 끝마쳤습니다.</p>
        
        {/* 통계 요약 피드백 */}
        <div className="grid grid-cols-3 gap-1 glass-card rounded-2xl w-full p-6 shadow-xl mb-8 relative">
          <div className="text-center">
            <p className="text-3xl font-extrabold text-correct tabular-nums tracking-tight">{results.correct}</p>
            <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wide">아는 단어</p>
          </div>
          <div className="border-r border-white/[0.04]" />
          <div className="text-center">
            <p className="text-3xl font-extrabold text-wrong tabular-nums tracking-tight">{results.wrong}</p>
            <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wide">모르는 단어</p>
          </div>
          <div className="border-r border-white/[0.04]" />
          <div className="text-center">
            <p className="text-3xl font-extrabold text-primary tabular-nums tracking-tight">{rate}%</p>
            <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wide">정답률</p>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <button 
            onClick={loadWords}
            className="flex-1 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm font-bold text-slate-300 hover:bg-white/[0.08] transition-all spring-active"
          >
            다시 학습하기
          </button>
          <button 
            onClick={() => router.push("/")}
            className="flex-1 py-3.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/10 transition-all spring-active"
          >
            홈으로 가기
          </button>
        </div>
      </div>
    );
  }

  const word = words[index];
  const cardAnimClass = animState === "exit" ? "card-exit" : animState === "enter" ? "card-enter" : "";

  const frontLabel = langMode === "en-ko" ? "뜻을 떠올려보세요" : "단어를 맞춰보세요";
  const frontText  = langMode === "en-ko" ? word.english  : word.korean;
  const backLabel  = langMode === "en-ko" ? "정답 (뜻)" : "정답 (영단어)";
  const backText   = langMode === "en-ko" ? word.korean : word.english;
  const flipHint   = langMode === "en-ko" ? "카드를 탭하거나 Space키로 확인" : "카드를 탭하거나 Space키로 확인";
  const revealLabel = langMode === "en-ko" ? "정답 확인하기" : "정답 확인하기";

  return (
    <div className="max-w-xl mx-auto px-6 py-10 page-in">
      {/* 진행률 바 */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
            style={{ width: `${(index / words.length) * 100}%` }} 
          />
        </div>
        <span className="text-xs font-bold text-slate-500 shrink-0 tabular-nums">{index + 1} / {words.length}</span>
        
        {/* 언어 토글 */}
        <button
          onClick={() => { setLangMode((m) => m === "en-ko" ? "ko-en" : "en-ko"); setFlipped(false); }}
          className="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-slate-200 hover:border-white/[0.15] transition-all spring-active"
        >
          {langMode === "en-ko" ? "EN → KO" : "KO → EN"}
        </button>

        {/* 편집 버튼 */}
        <button
          onClick={() => { setEditingWord(word); setEditEnglish(word.english); setEditKorean(word.korean); }}
          className="p-1.5 rounded-lg border border-white/[0.08] text-slate-500 hover:text-primary transition-all spring-active"
          title="단어 즉시 수정"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>

      {/* 카드 */}
      <div
        className={`card-perspective cursor-pointer mb-6 relative select-none ${cardAnimClass}`}
        onClick={() => animState === "idle" && setFlipped((f) => !f)}
      >
        <div
          className="card-inner relative w-full min-h-[300px] shadow-2xl"
          style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          {/* 앞면 */}
          <div
            className="card-face w-full min-h-[300px] glass-card rounded-3xl flex flex-col items-center justify-between px-8 py-10 border-white/[0.06] bg-[#0F121F]/80"
          >
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{frontLabel}</p>
            <p className="text-3xl font-extrabold text-foreground text-center leading-snug tracking-tight my-8">{frontText}</p>
            <p className="text-[10px] font-semibold text-slate-500 flex items-center gap-1.5 opacity-60">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
              </svg>
              {flipHint}
            </p>
          </div>
          {/* 뒷면 */}
          <div
            className="card-face card-back w-full min-h-[300px] bg-gradient-to-br from-primary to-blue-600 rounded-3xl flex flex-col items-center justify-between px-8 py-10 shadow-[inset_0_0_40px_rgba(0,0,0,0.3)] absolute top-0 left-0"
          >
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">{backLabel}</p>
            <p className="text-3xl font-extrabold text-white text-center leading-snug tracking-tight my-8">{backText}</p>
            <p className="text-[10px] font-bold text-blue-200/80">정답을 확인하셨나요?</p>
          </div>
        </div>
      </div>

      {/* O / X 버튼 및 뜻 보기 */}
      <div className="relative min-h-[72px]">
        {flipped ? (
          <div className="flex gap-3 fade-in">
            <button 
              onClick={(e) => { e.stopPropagation(); goNext(false); }}
              className="flex-1 py-4 bg-wrong/5 hover:bg-wrong/10 border border-wrong/20 text-wrong font-extrabold text-sm rounded-2xl shadow-lg shadow-wrong/5 flex items-center justify-center gap-2 transition-all spring-active"
            >
              <span>✗</span>
              <span>모르겠어요 (Left)</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); goNext(true); }}
              className="flex-1 py-4 bg-correct/5 hover:bg-correct/10 border border-correct/20 text-correct font-extrabold text-sm rounded-2xl shadow-lg shadow-correct/5 flex items-center justify-center gap-2 transition-all spring-active"
            >
              <span>✓</span>
              <span>알겠어요 (Right)</span>
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setFlipped(true)}
            className="w-full py-4 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-slate-300 font-bold text-sm rounded-2xl shadow-md transition-all spring-active fade-in"
          >
            {revealLabel}
          </button>
        )}
      </div>

      {/* 수정 모달 */}
      {editingWord && (
        <Portal>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0 fade-in"
            onClick={() => setEditingWord(null)}
          >
            <div 
              className="glass-card border-white/[0.08] rounded-3xl p-6 w-full max-w-sm shadow-2xl bg-[#0E111E]"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-base font-extrabold text-foreground mb-4 tracking-tight">단어 정보 수정</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-2 block tracking-wide">영단어 (English)</label>
                  <input
                    value={editEnglish}
                    onChange={(e) => setEditEnglish(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm font-mono text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-2 block tracking-wide">한국어 뜻 (Korean)</label>
                  <input
                    value={editKorean}
                    onChange={(e) => setEditKorean(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setEditingWord(null)}
                  className="flex-1 py-3 text-sm font-bold text-slate-400 hover:text-slate-200 border border-white/[0.08] rounded-xl transition-all spring-active"
                >
                  취소
                </button>
                <button
                  onClick={handleEditSave}
                  className="flex-1 py-3 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/10 transition-all spring-active"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
