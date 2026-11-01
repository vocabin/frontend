"use client";

import { useState } from "react";
import { pocketApi, Word } from "@/lib/api";
import Portal from "@/components/Portal";

interface Props {
  initialEnglish?: string;
  initialKorean?: string;
  initialMemo?: string;
  onClose: () => void;
  onSaved: (message: string, word: Word) => void;
}

const inputClass =
  "w-full bg-slate-950/60 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/30 transition-all";

export default function PocketAddModal({ initialEnglish = "", initialKorean = "", initialMemo = "", onClose, onSaved }: Props) {
  const [english, setEnglish] = useState(initialEnglish);
  const [korean, setKorean]   = useState(initialKorean);
  const [memo, setMemo]       = useState(initialMemo);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const canSave = english.trim() !== "" && korean.trim() !== "" && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      const res = await pocketApi.add(english.trim(), korean.trim(), memo.trim());
      onSaved("포켓에 담았어요", res.data);
      onClose();
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } }).response?.status;
      setError(status === 409 ? "이미 포켓에 담긴 표현이에요" : "저장하지 못했어요. 잠시 후 다시 시도해 주세요");
      setSaving(false);
    }
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0 fade-in"
        onClick={onClose}
      >
        <div
          className="glass-card border-white/[0.08] rounded-3xl p-6 w-full max-w-sm shadow-2xl bg-[#0E111E]"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-base font-extrabold text-foreground tracking-tight"><span className="text-pocket">★</span> 포켓에 담기</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">문장에서 외우고 싶은 숙어나 단어만 남겨도 돼요</p>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-2 block tracking-wide">영어 표현</label>
              <input value={english} onChange={(e) => setEnglish(e.target.value)} maxLength={500} autoFocus className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-2 block tracking-wide">뜻</label>
              <input value={korean} onChange={(e) => setKorean(e.target.value)} maxLength={500} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-2 block tracking-wide">메모 (선택)</label>
              <input value={memo} onChange={(e) => setMemo(e.target.value)} maxLength={500} placeholder="예문, 쓰임새 등" className={inputClass} />
            </div>
          </div>
          {error && <p className="text-xs font-semibold text-wrong mt-3">{error}</p>}
          <div className="flex gap-2 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-slate-400 hover:text-slate-200 border border-white/[0.08] rounded-xl transition-all spring-active"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="flex-1 py-3 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/10 transition-all spring-active disabled:opacity-40"
            >
              {saving ? "담는 중…" : "담기"}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
