"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { wordsApi, wordSetsApi, savedWordSetsApi, studyBookmarkApi, Word, WordSet, StudyBookmark } from "@/lib/api";

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
  const [bookmark, setBookmark] = useState<StudyBookmark | null>(null);
  const [pendingDeleteWordId, setPendingDeleteWordId] = useState<number | null>(null);
  const [showDeleteSetModal, setShowDeleteSetModal] = useState(false);
  const [deleteSetLoading, setDeleteSetLoading] = useState(false);

  const load = useCallback(() => {
    Promise.all([
      wordSetsApi.getAll(),
      wordsApi.getByWordSet(wordSetId),
      savedWordSetsApi.isSaved(wordSetId).catch(() => ({ data: { saved: false } })),
      studyBookmarkApi.get(wordSetId).catch(() => null),
    ]).then(([setsRes, wordsRes, savedRes, bookmarkRes]) => {
      const found = setsRes.data.find((s) => s.id === wordSetId) ?? null;
      setWordSet(found);
      setWords(wordsRes.data);
      setIsSaved(savedRes.data.saved);
      setBookmark(bookmarkRes ? bookmarkRes.data : null);
    }).catch(() => {
      setWordSet({ id: wordSetId, name: `세트 ${wordSetId}`, createdAt: "" });
      setWords([]);
    }).finally(() => setLoading(false));
  }, [wordSetId]);

  useEffect(() => { load(); }, [load]);

  const handleDeleteWord = async (wordId: number) => {
    try { await wordsApi.delete(wordId); } catch { /* ignore */ }
    setWords((prev) => prev.filter((w) => w.id !== wordId));
    setPendingDeleteWordId(null);
  };

  const handleDeleteWordSet = async () => {
    setDeleteSetLoading(true);
    try {
      await wordSetsApi.delete(wordSetId);
      router.replace("/words");
    } catch {
      setDeleteSetLoading(false);
      setShowDeleteSetModal(false);
    }
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
      <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <>
    <div className="max-w-3xl mx-auto px-6 py-10 page-in">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 rounded-xl bg-card border border-border hover:bg-primary/[0.03] text-muted hover:text-foreground transition-all flex items-center justify-center spring-active"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold text-foreground truncate tracking-tight">{wordSet?.name ?? "단어 세트"}</h1>
          <p className="text-xs text-muted mt-1 font-semibold">총 {words.length}개 영단어 등록됨</p>
        </div>
        <button
          onClick={handleToggleSave}
          disabled={saveLoading}
          className={`p-2.5 rounded-xl border transition-all spring-active cursor-pointer ${
            isSaved
              ? "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
              : "text-muted bg-card border-border hover:text-foreground hover:border-primary/20"
          }`}
          title={isSaved ? "구독 해제" : "세트 구독 추가"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
        <button
          onClick={() => setShowDeleteSetModal(true)}
          className="p-2.5 rounded-xl border text-muted bg-card border-border hover:text-wrong hover:border-wrong/30 hover:bg-wrong/5 transition-all spring-active cursor-pointer"
          title="세트 삭제"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>

      {/* 학습 모드 버튼 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <Link
          href={`/study/set-flashcard?wordSetId=${wordSetId}`}
          className="glass-card rounded-2xl p-5 hover:border-primary/30 transition-all duration-300 hover:bg-primary/[0.02] flex items-start gap-4 group spring-active"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 flex items-center justify-center text-lg shrink-0 group-hover:scale-108 transition-transform">
            📖
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">세트 집중 학습</p>
              <span className="text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all text-xs font-bold font-mono">→</span>
            </div>
            {bookmark && bookmark.wordIndex > 0 ? (
              <p className="text-[11px] text-primary/80 mt-1 leading-relaxed font-semibold">
                {bookmark.wordIndex + 1}번째 단어부터 이어서 학습
              </p>
            ) : (
              <p className="text-[11px] text-muted mt-1 leading-relaxed">마지막 위치에서 바로 이어서 학습합니다.</p>
            )}
          </div>
        </Link>
        <Link
          href={`/study/flashcard?wordSetId=${wordSetId}`}
          className="glass-card rounded-2xl p-5 hover:border-primary/30 transition-all duration-300 hover:bg-primary/[0.02] flex items-start gap-4 group spring-active"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-lg shrink-0 group-hover:scale-108 transition-transform">
            🧠
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">SM-2 복습</p>
              <span className="text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all text-xs font-bold font-mono">→</span>
            </div>
            <p className="text-[11px] text-muted mt-1 leading-relaxed">에빙하우스 망각 곡선에 기초해 복습을 진행합니다.</p>
          </div>
        </Link>
        <Link
          href={`/study/speedrun?wordSetId=${wordSetId}`}
          className="glass-card rounded-2xl p-5 hover:border-primary/30 transition-all duration-300 hover:bg-primary/[0.02] flex items-start gap-4 group spring-active"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center text-lg shrink-0 group-hover:scale-108 transition-transform">
            ⚡
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">스피드런 게임</p>
              <span className="text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all text-xs font-bold font-mono">→</span>
            </div>
            <p className="text-[11px] text-muted mt-1 leading-relaxed">이 세트의 단어로 60초 타임어택을 시작합니다.</p>
          </div>
        </Link>
      </div>

      {/* 단어 목록 */}
      <div className="glass-card rounded-2xl divide-y divide-border overflow-hidden">
        {words.map((word, i) => (
          <div
            key={word.id}
            className="flex items-center justify-between px-5 py-4 hover:bg-primary/[0.01] group transition-colors"
          >
            <div className="flex items-center gap-4 min-w-0">
              <span className="text-xs font-bold text-slate-500 tabular-nums w-5 shrink-0 text-right">{i + 1}</span>
              <div className="min-w-0">
                <span className="font-mono text-[15px] font-bold text-foreground tracking-tight">{word.english}</span>
                <p className="text-xs text-muted mt-1 truncate font-semibold">{word.korean}</p>
              </div>
            </div>
            {/* 액션 버튼 */}
            {pendingDeleteWordId === word.id ? (
              <div className="flex items-center gap-2 shrink-0 ml-4 fade-in">
                <span className="text-[11px] text-muted font-semibold">삭제할까요?</span>
                <button
                  onClick={() => setPendingDeleteWordId(null)}
                  className="px-2.5 py-1 text-[11px] font-bold text-muted border border-border rounded-lg bg-card hover:bg-white/[0.06] transition-all spring-active"
                >
                  취소
                </button>
                <button
                  onClick={() => handleDeleteWord(word.id)}
                  className="px-2.5 py-1 text-[11px] font-bold text-wrong border border-wrong/20 bg-wrong/5 rounded-lg hover:bg-wrong/10 transition-all spring-active"
                >
                  삭제
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity shrink-0 ml-4">
                <button
                  onClick={() => { setEditingWord(word); setEditEnglish(word.english); setEditKorean(word.korean); }}
                  className="p-2 text-muted hover:text-foreground hover:bg-primary/[0.04] rounded-lg transition-all spring-active cursor-pointer"
                  title="수정"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => setPendingDeleteWordId(word.id)}
                  className="p-2 text-muted hover:text-wrong hover:bg-wrong/5 rounded-lg transition-all spring-active cursor-pointer"
                  title="삭제"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}

        {words.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <p className="text-sm font-semibold text-slate-400">등록된 단어가 없습니다</p>
            <Link href="/words/upload" className="mt-4 inline-block text-xs bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-xl hover:bg-primary/20 transition-all spring-active">
              단어 업로드하기 →
            </Link>
          </div>
        )}
      </div>

    </div>

      {/* 세트 삭제 확인 모달 */}
      {showDeleteSetModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0 fade-in"
          onClick={() => !deleteSetLoading && setShowDeleteSetModal(false)}
        >
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-wrong/10 rounded-2xl flex items-center justify-center mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-wrong">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </div>
            <p className="text-base font-extrabold text-foreground mb-1 tracking-tight">세트를 삭제할까요?</p>
            <p className="text-xs text-muted mb-6 leading-relaxed">
              <span className="font-bold text-foreground">{wordSet?.name}</span> 세트와 포함된 모든 단어, 학습 기록이 영구 삭제됩니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteSetModal(false)}
                disabled={deleteSetLoading}
                className="flex-1 py-3 text-sm font-bold text-muted hover:text-foreground border border-border rounded-xl transition-all spring-active bg-card"
              >
                취소
              </button>
              <button
                onClick={handleDeleteWordSet}
                disabled={deleteSetLoading}
                className="flex-1 py-3 text-sm font-bold bg-wrong text-white rounded-xl hover:opacity-90 shadow-lg shadow-wrong/10 transition-all spring-active"
              >
                {deleteSetLoading ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {editingWord && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0 fade-in"
          onClick={() => setEditingWord(null)}
        >
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-base font-extrabold text-foreground mb-4 tracking-tight">단어 정보 수정</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-2 block tracking-wide">영단어 (English)</label>
                <input
                  value={editEnglish}
                  onChange={(e) => setEditEnglish(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-mono text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-2 block tracking-wide">한국어 뜻 (Korean)</label>
                <input
                  value={editKorean}
                  onChange={(e) => setEditKorean(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setEditingWord(null)}
                className="flex-1 py-3 text-sm font-bold text-muted hover:text-foreground border border-border rounded-xl transition-all spring-active bg-card"
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
      )}
    </>
  );
}
