"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { wordSetsApi, WordSet } from "@/lib/api";

type UploadType = "quizlet" | "hackers" | "template";

const TYPE_META: Record<UploadType, { label: string; desc: string; accept: string; hint: string }> = {
  quizlet: {
    label: "퀴즐렛 파일",
    desc: "Quizlet 내보내기 CSV",
    accept: ".csv,.xlsx,.xls,.pdf",
    hint: ".csv / .xlsx / .xls / .pdf",
  },
  hackers: {
    label: "해커스 암기장",
    desc: "토익 800+ 단어 PDF",
    accept: ".pdf",
    hint: ".pdf 파일 전용",
  },
  template: {
    label: "기본 템플릿",
    desc: "헤더가 포함된 CSV",
    accept: ".csv",
    hint: ".csv 파일 전용",
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
    if (!file) { setError("업로드할 파일을 선택해주세요."); return; }
    setUploading(true);
    setError("");
    setResult(null);
    try {
      let targetSetId: number;
      if (selectedSetId === "new") {
        if (!newSetName.trim()) { setError("새 단어 세트 이름을 입력해주세요."); setUploading(false); return; }
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
      setError("업로드 처리에 실패했습니다. 파일 양식을 다시 한 번 검토해주세요.");
    } finally {
      setUploading(false);
    }
  };

  const meta = TYPE_META[uploadType];

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 page-in">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">단어 데이터 업로드</h1>
        <p className="text-xs text-slate-400 mt-2 font-medium">퀴즐렛 파일, 해커스 암기장 PDF, CSV 템플릿의 단어를 바로 가입한 계정으로 가져옵니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 세트 선택 */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-wider">대상 단어 세트</label>
            <select
              value={selectedSetId}
              onChange={(e) => setSelectedSetId(e.target.value === "new" ? "new" : Number(e.target.value))}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/30 transition-all font-semibold"
            >
              <option value="new">+ 새 단어 세트 생성하여 업로드</option>
              {wordSets.map((s) => (
                <option key={s.id} value={s.id} className="bg-card text-foreground">{s.name}</option>
              ))}
            </select>
          </div>

          {selectedSetId === "new" && (
            <div className="fade-in">
              <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-wider">새 단어 세트 이름</label>
              <input
                value={newSetName}
                onChange={(e) => setNewSetName(e.target.value)}
                placeholder="예: 토익 보카 800+ DAY 1"
                required
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-sub focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/30 transition-all font-medium"
              />
            </div>
          )}
        </div>

        {/* 파일 형식 선택 */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-wider">가져올 파일 양식</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.keys(TYPE_META) as UploadType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => { setUploadType(type); setFile(null); setError(""); }}
                className={`py-3.5 px-3 rounded-xl border text-center transition-all spring-active flex flex-col items-center justify-center ${
                  uploadType === type
                    ? "bg-primary/10 text-primary border-primary shadow-lg shadow-primary/5"
                    : "bg-card text-muted border-border hover:border-primary/30 hover:text-foreground"
                }`}
              >
                <span className="text-sm font-extrabold tracking-tight">{TYPE_META[type].label}</span>
                <span className="text-[10px] text-slate-500 mt-1.5 font-medium leading-relaxed">
                  {TYPE_META[type].desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 파일 선택 */}
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <label className="text-xs font-bold text-slate-400 mb-2 block uppercase tracking-wider">파일 등록</label>
          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border bg-background/50 hover:bg-primary/[0.02] rounded-2xl cursor-pointer hover:border-primary/60 transition-all duration-300 group">
            <input
              type="file"
              accept={meta.accept}
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(""); setResult(null); }}
              className="hidden"
            />
            {file ? (
              <div className="text-center px-6">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-primary truncate max-w-xs">{file.name}</p>
                <p className="text-xs text-slate-500 mt-1 tabular-nums font-semibold">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="text-center px-4">
                <div className="w-12 h-12 bg-white/[0.02] rounded-2xl flex items-center justify-center text-slate-500 mx-auto mb-3 transition-transform duration-300 group-hover:-translate-y-1">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-300 tracking-tight">클릭하여 파일 선택</p>
                <p className="text-xs text-slate-500 mt-1.5 font-medium">지원 확장자: {meta.hint}</p>
              </div>
            )}
          </label>
        </div>

        {error && (
          <div className="flex items-center gap-3 px-5 py-4 bg-wrong/5 border border-wrong/10 rounded-2xl fade-in">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-wrong shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <p className="text-xs font-semibold text-wrong">{error}</p>
          </div>
        )}

        {result && (
          <div className="flex items-center gap-3 px-5 py-4 bg-correct/5 border border-correct/10 rounded-2xl fade-in">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-correct shrink-0">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <p className="text-xs font-bold text-correct">
              {result.saved > 0 ? `${result.saved}개의 단어가 성공적으로 데이터베이스에 저장되었습니다!` : "가져온 단어가 없습니다. 파일 구성 양식을 확인해주세요."}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !file}
          className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-extrabold text-sm rounded-xl shadow-lg shadow-primary/10 transition-all disabled:opacity-50 spring-active flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              업로드 가공 처리 중…
            </>
          ) : (
            "업로드 시작"
          )}
        </button>
      </form>
    </div>
  );
}
