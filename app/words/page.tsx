"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { wordsApi, wordSetsApi, Word, WordSet } from "@/lib/api";

export default function WordsPage() {
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<number | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [editEnglish, setEditEnglish] = useState("");
  const [editKorean, setEditKorean] = useState("");

  const DUMMY_SETS: WordSet[] = [
    { id: 1, name: "Week 1 — 기초 어휘", createdAt: "" },
    { id: 2, name: "Week 2 — 중급 어휘", createdAt: "" },
  ];
  const DUMMY_WORDS: Record<number, Word[]> = {
    1: [
      { id: 1, english: "abandon", korean: "포기하다, 버리다", wordSetId: 1 },
      { id: 2, english: "abstract", korean: "추상적인; 요약하다", wordSetId: 1 },
      { id: 3, english: "accelerate", korean: "가속하다", wordSetId: 1 },
      { id: 4, english: "accumulate", korean: "축적하다", wordSetId: 1 },
    ],
    2: [
      { id: 5, english: "benevolent", korean: "자애로운, 친절한", wordSetId: 2 },
      { id: 6, english: "brevity", korean: "간결함", wordSetId: 2 },
      { id: 7, english: "callous", korean: "냉담한, 무정한", wordSetId: 2 },
    ],
  };

  useEffect(() => {
    wordSetsApi.getAll()
      .then((res) => {
        setWordSets(res.data);
        if (res.data.length > 0) setSelectedSetId(res.data[0].id);
      })
      .catch(() => {
        setWordSets(DUMMY_SETS);
        setSelectedSetId(1);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadWords = useCallback((setId: number) => {
    wordsApi.getByWordSet(setId)
      .then((res) => setWords(res.data))
      .catch(() => setWords(DUMMY_WORDS[setId] ?? []));
  }, []);

  useEffect(() => {
    if (selectedSetId !== null) loadWords(selectedSetId);
  }, [selectedSetId, loadWords]);

  const handleDelete = async (wordId: number) => {
    if (!confirm("이 단어를 삭제할까요?")) return;
    try { await wordsApi.delete(wordId); } catch { /* 더미 모드 */ }
    setWords((prev) => prev.filter((w) => w.id !== wordId));
  };

  const handleEdit = (word: Word) => {
    setEditingWord(word);
    setEditEnglish(word.english);
    setEditKorean(word.korean);
  };

  const handleEditSave = async () => {
    if (!editingWord) return;
    try { await wordsApi.update(editingWord.id, editEnglish, editKorean); } catch { /* 더미 모드 */ }
    setWords((prev) =>
      prev.map((w) => w.id === editingWord.id ? { ...w, english: editEnglish, korean: editKorean } : w)
    );
    setEditingWord(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">단어</h1>
        <Link
          href="/words/upload"
          className="px-3 py-1.5 text-xs font-medium text-slate-400 border border-white/[0.08] rounded-lg hover:border-white/[0.15] hover:text-slate-200 transition-all"
        >
          + 업로드
        </Link>
      </div>

      {/* 세트 탭 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5 scrollbar-hide">
        {wordSets.map((set) => (
          <button
            key={set.id}
            onClick={() => setSelectedSetId(set.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-100 ${
              selectedSetId === set.id
                ? "bg-primary/10 text-primary"
                : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
            }`}
          >
            {set.name}
          </button>
        ))}
      </div>

      {/* 단어 수 */}
      {words.length > 0 && (
        <p className="text-[11px] text-slate-600 mb-3 tabular-nums">{words.length}개</p>
      )}

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
                onClick={() => handleEdit(word)}
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
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm font-mono text-foreground focus:outline-none focus:border-primary/50 transition-colors placeholder:text-slate-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">뜻</label>
                <input
                  value={editKorean}
                  onChange={(e) => setEditKorean(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors placeholder:text-slate-600"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setEditingWord(null)}
                className="flex-1 py-2.5 text-sm text-slate-500 hover:text-slate-300 border border-white/[0.07] rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleEditSave}
                className="flex-1 py-2.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
