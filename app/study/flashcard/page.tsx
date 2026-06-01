"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { wordsApi, studyApi, Word } from "@/lib/api";

const DUMMY_WORDS: Word[] = [
  { id: 1, term: "abandon",    definition: "포기하다, 버리다",    wordSetId: 1, weakCount: 0 },
  { id: 2, term: "abstract",   definition: "추상적인; 요약하다",  wordSetId: 1, weakCount: 1 },
  { id: 3, term: "accelerate", definition: "가속하다",            wordSetId: 1, weakCount: 0 },
  { id: 4, term: "accumulate", definition: "축적하다",            wordSetId: 1, weakCount: 3 },
  { id: 5, term: "benevolent", definition: "자애로운, 친절한",    wordSetId: 1, weakCount: 2 },
];

type AnimState = "idle" | "exit" | "enter";

export default function FlashcardPage() {
  const router = useRouter();

  const [words, setWords]         = useState<Word[]>([]);
  const [index, setIndex]         = useState(0);
  const [flipped, setFlipped]     = useState(false);
  const [loading, setLoading]     = useState(true);
  const [finished, setFinished]   = useState(false);
  const [results, setResults]     = useState({ correct: 0, wrong: 0 });
  const [animState, setAnimState] = useState<AnimState>("idle");
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [editTerm, setEditTerm]   = useState("");
  const [editDef, setEditDef]     = useState("");

  const loadWords = useCallback(() => {
    setLoading(true);
    setIndex(0); setFlipped(false); setFinished(false);
    setResults({ correct: 0, wrong: 0 }); setAnimState("idle");
    wordsApi.getDue()
      .then((r) => setWords(r.data))
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
    wordsApi.update(editingWord.id, editTerm, editDef).catch(() => {});
    setWords((p) => p.map((w) => w.id === editingWord.id ? { ...w, term: editTerm, definition: editDef } : w));
    setEditingWord(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (finished) {
    const total = results.correct + results.wrong;
    const rate  = total > 0 ? Math.round((results.correct / total) * 100) : 0;
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-card shadow-sm flex items-center justify-center text-4xl mb-5">
          {rate >= 70 ? "🎉" : "💪"}
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-1">학습 완료!</h2>
        <p className="text-slate-400 text-sm mb-8">{total}개 단어 완료</p>
        <div className="flex gap-6 mb-8 bg-card rounded-3xl px-10 py-6 shadow-sm">
          <div className="text-center"><p className="text-3xl font-bold text-correct">{results.correct}</p><p className="text-xs text-slate-500 mt-1">정답</p></div>
          <div className="w-px bg-slate-700" />
          <div className="text-center"><p className="text-3xl font-bold text-wrong">{results.wrong}</p><p className="text-xs text-slate-500 mt-1">오답</p></div>
          <div className="w-px bg-slate-700" />
          <div className="text-center"><p className="text-3xl font-bold text-primary">{rate}%</p><p className="text-xs text-slate-500 mt-1">정답률</p></div>
        </div>
        <div className="flex gap-2 w-full">
          <button onClick={loadWords}
            className="flex-1 py-3.5 bg-card border border-slate-700 rounded-2xl text-sm font-medium text-slate-300 shadow-sm hover:shadow-md hover:bg-slate-800/50 transition-all">
            다시 하기
          </button>
          <button onClick={() => router.push("/")}
            className="flex-1 py-3.5 bg-primary text-white rounded-2xl text-sm font-semibold shadow-sm hover:bg-primary-hover transition-all">
            홈으로
          </button>
        </div>
      </div>
    );
  }

  const word = words[index];
  const cardAnimClass = animState === "exit" ? "card-exit" : animState === "enter" ? "card-enter" : "";

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* 진행률 바 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-1 bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(index / words.length) * 100}%` }} />
        </div>
        <span className="text-xs text-slate-500 shrink-0 tabular-nums">{index + 1}/{words.length}</span>
        <button
          onClick={() => { setEditingWord(word); setEditTerm(word.term); setEditDef(word.definition); }}
          className="text-slate-600 hover:text-primary transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>

      {/* 카드 */}
      <div
        className={`relative cursor-pointer mb-5 ${cardAnimClass}`}
        style={{ perspective: "1000px" }}
        onClick={() => animState === "idle" && setFlipped((f) => !f)}
      >
        <div
          className="relative w-full transition-transform duration-400"
          style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          <div
            className="w-full bg-card border border-slate-700/50 rounded-3xl flex flex-col items-center justify-center min-h-60 px-8 py-10 select-none shadow-sm"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-[11px] font-semibold text-slate-500 mb-5 uppercase tracking-widest">한국어 뜻</p>
            <p className="text-2xl font-bold text-foreground text-center leading-snug">{word.definition}</p>
            <p className="text-xs text-slate-500 mt-6">탭하거나 Space로 영단어 확인</p>
          </div>
          <div
            className="w-full bg-primary rounded-3xl flex flex-col items-center justify-center min-h-60 px-8 py-10 select-none shadow-sm absolute top-0 left-0"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="text-[11px] font-semibold text-blue-200 mb-5 uppercase tracking-widest">영단어</p>
            <p className="text-3xl font-bold text-white text-center">{word.term}</p>
          </div>
        </div>
      </div>

      {/* O / X 버튼 */}
      <div className={`transition-all duration-200 ${flipped && animState === "idle" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
        <div className="flex gap-3">
          <button onClick={() => goNext(false)}
            className="flex-1 py-4 bg-card border border-slate-700/50 rounded-2xl shadow-sm text-wrong font-bold text-lg hover:shadow-md hover:bg-slate-800/50 active:scale-95 transition-all duration-100 flex items-center justify-center gap-1.5">
            <span className="text-base">✗</span>
            <span className="text-xs font-normal text-slate-500">몰라요</span>
          </button>
          <button onClick={() => goNext(true)}
            className="flex-1 py-4 bg-card border border-slate-700/50 rounded-2xl shadow-sm text-correct font-bold text-lg hover:shadow-md hover:bg-slate-800/50 active:scale-95 transition-all duration-100 flex items-center justify-center gap-1.5">
            <span className="text-base">✓</span>
            <span className="text-xs font-normal text-slate-500">알아요</span>
          </button>
        </div>
        <p className="text-center text-[11px] text-slate-500 mt-3">← 몰라요 &nbsp;·&nbsp; 알아요 →</p>
      </div>

      {!flipped && (
        <button onClick={() => setFlipped(true)}
          className="w-full py-4 bg-card border border-slate-700/50 rounded-2xl shadow-sm text-sm font-medium text-slate-400 hover:bg-slate-800/50 transition-all">
          영단어 보기
        </button>
      )}

      {/* 수정 모달 */}
      {editingWord && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-card rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-foreground mb-4">단어 수정</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">영단어</label>
                <input value={editTerm} onChange={(e) => setEditTerm(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 text-foreground rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">뜻</label>
                <input value={editDef} onChange={(e) => setEditDef(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 text-foreground rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditingWord(null)}
                className="flex-1 py-3 border border-slate-700 rounded-xl text-sm text-slate-400 hover:bg-slate-800/50">취소</button>
              <button onClick={handleEditSave}
                className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-semibold">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
