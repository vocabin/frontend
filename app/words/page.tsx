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
  const [editTerm, setEditTerm] = useState("");
  const [editDef, setEditDef] = useState("");

  const DUMMY_SETS: WordSet[] = [
    { id: 1, name: "Week 1 — 기초 어휘", wordCount: 4, learnedCount: 3, correctRate: 80 },
    { id: 2, name: "Week 2 — 중급 어휘", wordCount: 3, learnedCount: 1, correctRate: 62 },
  ];
  const DUMMY_WORDS: Record<number, Word[]> = {
    1: [
      { id: 1, term: "abandon", definition: "포기하다, 버리다", wordSetId: 1, weakCount: 0 },
      { id: 2, term: "abstract", definition: "추상적인; 요약하다", wordSetId: 1, weakCount: 1 },
      { id: 3, term: "accelerate", definition: "가속하다", wordSetId: 1, weakCount: 0 },
      { id: 4, term: "accumulate", definition: "축적하다", wordSetId: 1, weakCount: 3 },
    ],
    2: [
      { id: 5, term: "benevolent", definition: "자애로운, 친절한", wordSetId: 2, weakCount: 2 },
      { id: 6, term: "brevity", definition: "간결함", wordSetId: 2, weakCount: 0 },
      { id: 7, term: "callous", definition: "냉담한, 무정한", wordSetId: 2, weakCount: 4 },
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
    try {
      await wordsApi.delete(wordId);
    } catch {
      // 더미 모드
    }
    setWords((prev) => prev.filter((w) => w.id !== wordId));
  };

  const handleEdit = (word: Word) => {
    setEditingWord(word);
    setEditTerm(word.term);
    setEditDef(word.definition);
  };

  const handleEditSave = async () => {
    if (!editingWord) return;
    try {
      await wordsApi.update(editingWord.id, editTerm, editDef);
    } catch {
      // 더미 모드
    }
    setWords((prev) =>
      prev.map((w) =>
        w.id === editingWord.id ? { ...w, term: editTerm, definition: editDef } : w
      )
    );
    setEditingWord(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">단어 목록</h1>
        <Link
          href="/words/upload"
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-hover transition-colors"
        >
          + 업로드
        </Link>
      </div>

      {/* 세트 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {wordSets.map((set) => (
          <button
            key={set.id}
            onClick={() => setSelectedSetId(set.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
              selectedSetId === set.id
                ? "bg-primary text-white"
                : "bg-card text-slate-400 hover:text-foreground"
            }`}
          >
            {set.name}
          </button>
        ))}
      </div>

      {/* 단어 목록 */}
      <div className="space-y-2">
        {words.map((word) => (
          <div
            key={word.id}
            className="bg-card rounded-xl px-4 py-3 flex items-center justify-between group"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground text-sm">{word.term}</span>
                {word.weakCount >= 3 && (
                  <span className="text-[10px] bg-wrong/10 text-wrong font-medium px-1.5 py-0.5 rounded-md">
                    취약
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 mt-0.5 block">{word.definition}</span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleEdit(word)}
                className="p-1.5 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-slate-700/50"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(word.id)}
                className="p-1.5 text-slate-400 hover:text-wrong transition-colors rounded-lg hover:bg-slate-700/50"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          <div className="text-center py-16 text-slate-500">
            <p className="text-sm">이 세트에 단어가 없어요</p>
            <Link href="/words/upload" className="mt-2 inline-block text-sm text-primary hover:underline">
              단어 업로드하기 →
            </Link>
          </div>
        )}
      </div>

      {/* 수정 모달 */}
      {editingWord && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-foreground mb-4">단어 수정</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">영단어</label>
                <input
                  value={editTerm}
                  onChange={(e) => setEditTerm(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">뜻</label>
                <input
                  value={editDef}
                  onChange={(e) => setEditDef(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setEditingWord(null)}
                className="flex-1 py-2.5 border border-slate-700 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-700/50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleEditSave}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors"
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
