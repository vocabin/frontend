"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { wordsApi, wordSetsApi, savedWordSetsApi, Word, WordSet } from "@/lib/api";

export default function WordSetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const wordSetId = Number(id);

  const [wordSet, setWordSet] = useState<WordSet | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [editEnglish, setEditEnglish] = useState("");
  const [editKorean, setEditKorean] = useState("");

  const load = useCallback(() => {
    Promise.all([
      wordSetsApi.getAll(),
      wordsApi.getByWordSet(wordSetId),
      savedWordSetsApi.isSaved(wordSetId).catch(() => ({ data: { saved: false } })),
    ]).then(([setsRes, wordsRes, savedRes]) => {
      const found = setsRes.data.find((s) => s.id === wordSetId) ?? null;
      setWordSet(found);
      setWords(wordsRes.data);
      setIsSaved(savedRes.data.saved);
    }).catch(() => {
      setWordSet({ id: wordSetId, name: `세트 ${wordSetId}`, createdAt: "" });
      setWords([]);
    }).finally(() => setLoading(false));
  }, [wordSetId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (wordId: number) => {
    if (!confirm("이 단어를 삭제할까요?")) return;
    try { await wordsApi.delete(wordId); } catch { /* ignore */ }
    setWords((prev) => prev.filter((w) => w.id !== wordId));
  };

  const handleToggleSave = async () => {
    setSaveLoading(true);
    try {
      if (isSaved) {
        await savedWordSetsApi.unsave(wordSetId);
        setIsSaved(false);
      } else {
        await savedWordSetsApi.save(wordSetId);
        setIsSaved(true);
      }
    } catch { /* ignore */ }
    setSaveLoading(false);
  };

  const handleEditSave = async () => {
    if (!editingWord) return;
    try { await wordsApi.update(editingWord.id, editEnglish, editKorean); } catch { /* ignore */ }
    setWords((prev) => prev.map((w) => w.id === editingWord.id ? { ...w, english: editEnglish, korean: editKorean } : w));
    setEditingWord(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-300 transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate">{wordSet?.name ?? "단어 세트"}</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">{words.length}개</p>
        </div>
        <button
          onClick={handleToggleSave}
          disabled={saveLoading}
          className={`p-1.5 rounded-lg transition-colors ${isSaved ? "text-yellow-400" : "text-slate-600 hover:text-slate-300"}`}
          title={isSaved ? "저장 취소" : "세트 저장"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      </div>

      {/* 학습 모드 버튼 */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <Link
          href={`/study/set-flashcard?wordSetId=${wordSetId}`}
          className="bg-card border border-white/[0.05] rounded-xl p-4 card-lift"
        >
          <p className="text-sm font-semibold text-foreground">세트 학습</p>
          <p className="text-xs text-slate-500 mt-0.5">책갈피 지원</p>
        </Link>
        <Link
          href={`/study/flashcard?wordSetId=${wordSetId}`}
          className="bg-card border border-white/[0.05] rounded-xl p-4 card-lift"
        >
          <p className="text-sm font-semibold text-foreground">SM-2</p>
          <p className="text-xs text-slate-500 mt-0.5">복습 알고리즘</p>
        </Link>
        <Link
          href={`/study/speedrun?wordSetId=${wordSetId}`}
          className="bg-card border border-white/[0.05] rounded-xl p-4 card-lift"
        >
          <p className="text-sm font-semibold text-foreground">스피드런</p>
          <p className="text-xs text-slate-500 mt-0.5">60초 타임어택</p>
        </Link>
      </div>

      {/* 단어 목록 */}
      <div className="space-y-px">
        {words.map((word, i) => (
          <div
            key={word.id}
            className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-white/[0.03] group transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-[11px] text-slate-700 tabular-nums w-5 shrink-0 text-right">{i + 1}</span>
              <div className="min-w-0">
                <span className="font-mono text-sm text-foreground tracking-tight">{word.english}</span>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{word.korean}</p>
              </div>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
              <button
                onClick={() => { setEditingWord(word); setEditEnglish(word.english); setEditKorean(word.korean); }}
                className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors rounded"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(word.id)}
                className="p-1.5 text-slate-600 hover:text-wrong/80 transition-colors rounded"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {words.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-slate-600">단어가 없어요</p>
            <Link href="/words/upload" className="mt-2 inline-block text-xs text-primary/70 hover:text-primary transition-colors">
              업로드하기 →
            </Link>
          </div>
        )}
      </div>

      {/* 수정 모달 */}
      {editingWord && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-card border border-white/[0.07] rounded-xl p-5 w-full max-w-sm shadow-2xl">
            <p className="text-sm font-semibold text-foreground mb-4">단어 수정</p>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">영단어</label>
                <input
                  value={editEnglish}
                  onChange={(e) => setEditEnglish(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm font-mono text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">뜻</label>
                <input
                  value={editKorean}
                  onChange={(e) => setEditKorean(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setEditingWord(null)} className="flex-1 py-2.5 text-sm text-slate-500 border border-white/[0.07] rounded-lg hover:text-slate-300 transition-colors">취소</button>
              <button onClick={handleEditSave} className="flex-1 py-2.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors">저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
