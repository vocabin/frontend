"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { wordSetsApi, WordSet } from "@/lib/api";

type UploadType = "quizlet" | "hackers" | "template";

const TYPE_META: Record<UploadType, { label: string; desc: string; accept: string; hint: string }> = {
  quizlet: {
    label: "퀴즐렛 파일",
    desc: "Quizlet에서 내보낸 파일",
    accept: ".csv,.xlsx,.xls,.pdf",
    hint: ".csv / .xlsx / .xls / .pdf",
  },
  hackers: {
    label: "해커스 단어암기장",
    desc: "해커스 토익 800+ PDF",
    accept: ".pdf",
    hint: ".pdf만 지원",
  },
  template: {
    label: "앱 템플릿",
    desc: "english,korean 헤더 CSV",
    accept: ".csv",
    hint: ".csv만 지원",
  },
};

export default function UploadPage() {
  const router = useRouter();
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<number | "new">("new");
  const [newSetName, setNewSetName] = useState("");
  const [uploadType, setUploadType] = useState<UploadType>("quizlet");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ saved: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    wordSetsApi.getAll()
      .then((res) => setWordSets(res.data))
      .catch(() =>
        setWordSets([
          { id: 1, name: "Week 1 — 기초 어휘", createdAt: "" },
          { id: 2, name: "Week 2 — 중급 어휘", createdAt: "" },
        ])
      );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError("파일을 선택해주세요."); return; }
    setUploading(true);
    setError("");
    setResult(null);
    try {
      let targetSetId: number;
      if (selectedSetId === "new") {
        if (!newSetName.trim()) { setError("세트 이름을 입력해주세요."); setUploading(false); return; }
        const res = await wordSetsApi.create(newSetName.trim());
        targetSetId = res.data.id;
      } else {
        targetSetId = selectedSetId;
      }

      let res;
      if (uploadType === "quizlet") {
        res = await wordSetsApi.uploadQuizlet(targetSetId, file);
      } else if (uploadType === "hackers") {
        res = await wordSetsApi.uploadHackers(targetSetId, file);
      } else {
        res = await wordSetsApi.uploadTemplate(targetSetId, file);
      }

      const saved = (res.data as { savedCount?: number }).savedCount ?? 0;
      setResult({ saved });
      if (saved > 0) {
        setTimeout(() => router.push("/words"), 1500);
      }
    } catch {
      setError("업로드 중 오류가 발생했어요. 파일 형식을 확인해주세요.");
    } finally {
      setUploading(false);
    }
  };

  const meta = TYPE_META[uploadType];

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">단어 업로드</h1>
        <p className="text-sm text-slate-400 mt-1">퀴즐렛, 해커스 단어암기장, 앱 템플릿을 지원해요</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 세트 선택 */}
        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 block">단어 세트</label>
          <select
            value={selectedSetId}
            onChange={(e) => setSelectedSetId(e.target.value === "new" ? "new" : Number(e.target.value))}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
          >
            <option value="new">+ 새 세트 만들기</option>
            {wordSets.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {selectedSetId === "new" && (
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">새 세트 이름</label>
            <input
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              placeholder="예: 해커스 토익 800+ DAY 01"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        )}

        {/* 파일 형식 선택 */}
        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 block">파일 형식</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(TYPE_META) as UploadType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => { setUploadType(type); setFile(null); setError(""); }}
                className={`py-3 px-2 rounded-xl text-xs font-medium border transition-all text-center ${
                  uploadType === type
                    ? "bg-primary text-white border-primary"
                    : "bg-slate-900/50 text-slate-400 border-slate-700 hover:border-slate-500"
                }`}
              >
                <span className="block font-semibold">{TYPE_META[type].label}</span>
                <span className={`block mt-0.5 ${uploadType === type ? "text-blue-200" : "text-slate-600"}`}>
                  {TYPE_META[type].desc}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">지원 형식: {meta.hint}</p>
        </div>

        {/* 파일 선택 */}
        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 block">파일 선택</label>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer hover:border-primary hover:bg-slate-800/30 transition-all">
            <input
              type="file"
              accept={meta.accept}
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(""); setResult(null); }}
              className="hidden"
            />
            {file ? (
              <div className="text-center px-4">
                <p className="text-sm font-medium text-primary truncate max-w-xs">{file.name}</p>
                <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="text-center">
                <svg className="mx-auto mb-2 text-slate-600" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="text-sm text-slate-500">클릭하여 파일 선택</p>
                <p className="text-xs text-slate-600 mt-0.5">{meta.hint}</p>
              </div>
            )}
          </label>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-wrong/10 border border-wrong/30 rounded-xl">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-wrong shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <p className="text-sm text-wrong">{error}</p>
          </div>
        )}

        {result && (
          <div className="flex items-center gap-2 px-4 py-3 bg-correct/10 border border-correct/30 rounded-xl">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-correct shrink-0">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <p className="text-sm text-correct font-medium">
              {result.saved > 0 ? `${result.saved}개 단어를 저장했어요! 잠시 후 이동합니다…` : "저장된 단어가 없어요. 파일 형식을 확인해주세요."}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !file}
          className="w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              업로드 중…
            </span>
          ) : "업로드"}
        </button>
      </form>
    </div>
  );
}
