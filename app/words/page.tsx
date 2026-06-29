"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { wordsApi, wordSetsApi, Word, WordSet } from "@/lib/api";
import Portal from "@/components/Portal";

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
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 page-in">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">단어 관리</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">단어 세트별 전체 영단어 조회 및 편집</p>
        </div>
        <Link
          href="/words/upload"
          className="px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/10 transition-all spring-active"
        >
          + 단어 업로드
        </Link>
      </div>

      {/* 세트 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {wordSets.map((set) => (
          <button
            key={set.id}
            onClick={() => setSelectedSetId(set.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 spring-active ${
              selectedSetId === set.id
                ? "bg-primary text-white shadow-md shadow-primary/10"
                : "bg-white/[0.02] border border-white/[0.08] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
            }`}
          >
            {set.name}
          </button>
        ))}
      </div>

      {/* 단어 개수 */}
      {words.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider tabular-nums">등록된 단어: {words.length}개</p>
        </div>
      )}

      {/* 단어 목록 */}
      <div className="glass-card rounded-2xl divide-y divide-white/[0.03] overflow-hidden">
        {words.map((word, i) => (
          <div
            key={word.id}
            className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] group transition-colors"
          >
            <div className="flex items-center gap-4 min-w-0">
              <span className="text-xs font-bold text-slate-600 tabular-nums w-5 shrink-0 text-right">{i + 1}</span>
              <div className="min-w-0">
                <span className="font-mono text-[15px] font-bold text-foreground tracking-tight">{word.english}</span>
                <p className="text-xs text-slate-400 mt-1 truncate font-medium">{word.korean}</p>
              </div>
            </div>
            {/* 액션 버튼 */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0 ml-4">
              <button
                onClick={() => handleEdit(word)}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] rounded-lg transition-all spring-active"
                title="수정"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(word.id)}
                className="p-2 text-slate-400 hover:text-wrong hover:bg-wrong/5 rounded-lg transition-all spring-active"
                title="삭제"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          <div className="text-center py-20 text-slate-500">
            <p className="text-sm font-semibold text-slate-400">이 세트에는 단어가 없습니다</p>
            <Link href="/words/upload" className="mt-4 inline-block text-xs bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-xl font-bold hover:bg-primary/20 transition-all spring-active">
              단어 업로드하기 →
            </Link>
          </div>
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
