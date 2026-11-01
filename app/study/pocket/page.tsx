"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { pocketApi, settingsApi, studyApi, Word } from "@/lib/api";
import { formatTime, listeningHref, parseMemoTimestamp } from "@/lib/youtube";
import PocketAddModal from "@/components/PocketAddModal";
import Toast from "@/components/Toast";
import { fieldClass, secondaryButtonClass } from "@/lib/ui";

type Tab = "review" | "list";

function MemoView({ memo, light = false }: { memo?: string | null; light?: boolean }) {
  if (!memo) return null;
  const stamp = parseMemoTimestamp(memo);
  const textClass = light ? "text-blue-100/90" : "text-slate-500";
  if (!stamp) return <p className={`text-xs ${textClass} break-words`}>{memo}</p>;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {stamp.rest && <p className={`text-xs ${textClass} break-words`}>{stamp.rest}</p>}
      <Link
        href={listeningHref(stamp.videoId, stamp.seconds)}
        onClick={(e) => e.stopPropagation()}
        className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-all spring-active ${
          light ? "bg-white/15 text-white hover:bg-white/25" : "bg-pocket/10 text-pocket hover:bg-pocket/20"
        }`}
      >
        ▶ {formatTime(stamp.seconds)} 듣기
      </Link>
    </div>
  );
}

export default function PocketPage() {
  const [tab, setTab]             = useState<Tab>("review");
  const [dueWords, setDueWords]   = useState<Word[]>([]);
  const [allWords, setAllWords]   = useState<Word[]>([]);
  const [loading, setLoading]     = useState(true);
  const [index, setIndex]         = useState(0);
  const [flipped, setFlipped]     = useState(false);
  const [finished, setFinished]   = useState(false);
  const [results, setResults]     = useState({ correct: 0, wrong: 0 });
  const [missed, setMissed]       = useState<Word[]>([]);
  const [query, setQuery]         = useState("");
  const [showAdd, setShowAdd]     = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [toast, setToast]         = useState("");
  const [flashId, setFlashId]     = useState<number | null>(null);
  const clearToast = useCallback(() => setToast(""), []);

  const load = useCallback(() => {
    setLoading(true);
    setIndex(0); setFlipped(false); setFinished(false);
    setResults({ correct: 0, wrong: 0 }); setMissed([]);
    Promise.all([pocketApi.getDue(), pocketApi.getAll(), settingsApi.get()])
      .then(([dueRes, allRes, settingsRes]) => {
        const limit = settingsRes.data.dailyGoal ?? 20;
        setDueWords(dueRes.data.slice(0, limit));
        setAllWords(allRes.data);
      })
      .catch(() => setToast("포켓을 불러오지 못했어요"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const answer = useCallback((correct: boolean) => {
    const word = dueWords[index];
    if (!word) return;
    studyApi.recordResult({ wordId: word.id, correct, mode: "POCKET" }).catch(() => {});
    setResults((r) => ({ correct: r.correct + (correct ? 1 : 0), wrong: r.wrong + (correct ? 0 : 1) }));
    if (!correct) setMissed((m) => [...m, word]);
    if (index + 1 >= dueWords.length) { setFinished(true); return; }
    setIndex((i) => i + 1);
    setFlipped(false);
  }, [dueWords, index]);

  useEffect(() => {
    if (tab !== "review" || finished || showAdd) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp") { e.preventDefault(); setFlipped((f) => !f); }
      if (e.key === "ArrowRight" && flipped) answer(true);
      if (e.key === "ArrowLeft" && flipped) answer(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [tab, finished, showAdd, flipped, answer]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allWords;
    return allWords.filter((w) =>
      [w.english, w.korean, w.memo ?? ""].some((field) => field.toLowerCase().includes(q))
    );
  }, [allWords, query]);

  const handleDelete = async (wordId: number) => {
    try {
      await pocketApi.remove(wordId);
      setAllWords((ws) => ws.filter((w) => w.id !== wordId));
      setDueWords((ws) => ws.filter((w) => w.id !== wordId));
      setToast("포켓에서 뺐어요");
    } catch {
      setToast("삭제하지 못했어요");
    } finally {
      setConfirmId(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const word = dueWords[index];
  const total = results.correct + results.wrong;
  const rate = total > 0 ? Math.round((results.correct / total) * 100) : 0;

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight"><span className="text-pocket">★</span> 포켓</h1>
          <p className="text-xs text-slate-500 mt-1">담아둔 숙어와 단어를 못 외운 것부터 복습해요</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="h-11 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/10 transition-all spring-active"
        >
          + 추가
        </button>
      </div>

      {/* 탭 */}
      <div className="grid grid-cols-2 gap-1 p-1 mb-6 rounded-xl bg-background border border-border">
        {([["review", `오늘 복습 ${dueWords.length}`], ["list", `전체 목록 ${allWords.length}`]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`h-10 rounded-lg text-sm font-bold transition-all ${
              tab === key ? "bg-card text-primary shadow-sm" : "text-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "review" && (
        <>
          {dueWords.length === 0 ? (
            <div className="glass-card rounded-3xl p-8 text-center fade-in">
              <p className="text-3xl mb-3">🎉</p>
              <h2 className="text-lg font-extrabold text-foreground mb-1">오늘 복습할 표현이 없어요</h2>
              <p className="text-xs text-slate-500 mb-6">
                {allWords.length === 0
                  ? "플래시카드에서 ⭐ 를 누르거나 리스닝 노트에서 표현을 담아 보세요."
                  : "다음 복습일이 되면 다시 나타나요."}
              </p>
              <Link
                href="/study/listening"
                className="inline-block px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all spring-active"
              >
                리스닝 노트 열기
              </Link>
            </div>
          ) : finished ? (
            <div className="fade-in">
              <h2 className="text-xl font-extrabold text-foreground text-center mb-6 tracking-tight">오늘 포켓 복습 완료!</h2>
              <div className="grid grid-cols-3 glass-card rounded-2xl p-6 mb-6 text-center">
                <div>
                  <p className="text-3xl font-extrabold text-correct tabular-nums">{results.correct}</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-2">아는 표현</p>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-wrong tabular-nums">{results.wrong}</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-2">모르는 표현</p>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-primary tabular-nums">{rate}%</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-2">정답률</p>
                </div>
              </div>
              {missed.length > 0 && (
                <div className="glass-card rounded-2xl p-5 mb-6">
                  <p className="text-xs font-bold text-slate-400 mb-3">이번에 틀린 표현 · 내일 다시 나와요</p>
                  <ul className="space-y-3">
                    {missed.map((w) => (
                      <li key={w.id}>
                        <p className="text-sm font-bold text-foreground">{w.english}</p>
                        <p className="text-xs text-slate-400">{w.korean}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={load}
                  className={`flex-1 h-12 rounded-xl text-sm font-bold ${secondaryButtonClass}`}
                >
                  다시 불러오기
                </button>
                <Link
                  href="/"
                  className="flex-1 h-12 flex items-center justify-center bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold transition-all spring-active"
                >
                  홈으로
                </Link>
              </div>
            </div>
          ) : (
            <div className="fade-in">
              {/* 진행률 */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${(index / dueWords.length) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-500 tabular-nums">{index + 1} / {dueWords.length}</span>
              </div>

              {/* 카드 */}
              <div
                className="card-perspective cursor-pointer mb-6 select-none"
                onClick={() => setFlipped((f) => !f)}
              >
                <div className="card-inner relative w-full min-h-[280px] shadow-2xl" style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
                  <div className="card-face w-full min-h-[280px] bg-card border border-border rounded-3xl flex flex-col items-center justify-between px-6 py-10">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">뜻을 떠올려보세요</p>
                    <p className="text-3xl font-extrabold text-foreground text-center leading-snug tracking-tight my-8">{word.english}</p>
                    <p className="text-[10px] font-semibold text-slate-500 opacity-60">카드를 탭하거나 Space키로 확인</p>
                  </div>
                  <div className="card-face card-back w-full min-h-[280px] bg-gradient-to-br from-primary to-blue-600 rounded-3xl flex flex-col items-center justify-between px-8 py-10 absolute top-0 left-0">
                    <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">정답</p>
                    <p className="text-2xl font-extrabold text-white text-center leading-snug tracking-tight my-6">{word.korean}</p>
                    <MemoView memo={word.memo} light />
                  </div>
                </div>
              </div>

              {/* O / X */}
              <div className="min-h-[72px]">
                {flipped ? (
                  <div className="flex gap-3 fade-in">
                    <button
                      onClick={() => answer(false)}
                      className="flex-1 py-4 bg-wrong/5 hover:bg-wrong/10 border border-wrong/20 text-wrong font-extrabold text-sm rounded-2xl transition-all spring-active"
                    >
                      ✗ 모르겠어요
                    </button>
                    <button
                      onClick={() => answer(true)}
                      className="flex-1 py-4 bg-correct/5 hover:bg-correct/10 border border-correct/20 text-correct font-extrabold text-sm rounded-2xl transition-all spring-active"
                    >
                      ✓ 알겠어요
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setFlipped(true)}
                    className={`w-full h-14 font-bold text-sm rounded-2xl ${secondaryButtonClass}`}
                  >
                    정답 확인하기
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {tab === "list" && (
        <div className="fade-in">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="영어, 뜻, 메모로 검색"
            className={`${fieldClass} mb-4`}
          />
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-12">
              {allWords.length === 0 ? "아직 담은 표현이 없어요" : "검색 결과가 없어요"}
            </p>
          ) : (
            <ul className="space-y-3">
              {filtered.map((w) => (
                <li
                  key={w.id}
                  className={`bg-card border border-border rounded-2xl p-4 flex items-start gap-3 ${w.id === flashId ? "pocket-flash" : ""}`}
                >
                  {/* notebook margin rule */}
                  <span aria-hidden className="self-stretch w-px bg-pocket/40" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-bold text-foreground break-words">{w.english}</p>
                    <p className="text-xs text-muted break-words">{w.korean}</p>
                    <MemoView memo={w.memo} />
                  </div>
                  {confirmId === w.id ? (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setConfirmId(null)} className={`h-10 px-3 text-xs font-bold rounded-lg ${secondaryButtonClass}`}>
                        취소
                      </button>
                      <button onClick={() => handleDelete(w.id)} className="h-10 px-3 text-xs font-bold text-white bg-wrong rounded-lg spring-active">
                        삭제
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmId(w.id)}
                      className="shrink-0 w-11 h-11 -mr-2 -mt-2 flex items-center justify-center rounded-lg text-muted hover:text-wrong transition-colors"
                      aria-label="포켓에서 삭제"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      </svg>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showAdd && (
        <PocketAddModal
          onClose={() => setShowAdd(false)}
          onSaved={(msg, saved) => {
            setToast(msg);
            setFlashId(saved.id);
            setQuery("");
            setTab("list");
            load();
          }}
        />
      )}
      {toast && <Toast message={toast} onDone={clearToast} />}
    </div>
  );
}
