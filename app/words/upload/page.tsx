"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { wordSetsApi, WordSet } from "@/lib/api";

export default function UploadPage() {
  const router = useRouter();
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<number | "new">("new");
  const [newSetName, setNewSetName] = useState("");
  const [uploadType, setUploadType] = useState<"quizlet" | "template">("quizlet");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    wordSetsApi.getAll()
      .then((res) => setWordSets(res.data))
      .catch(() =>
        setWordSets([
          { id: 1, name: "Week 1 — 기초 어휘", wordCount: 40, learnedCount: 32, correctRate: 80 },
          { id: 2, name: "Week 2 — 중급 어휘", wordCount: 50, learnedCount: 18, correctRate: 62 },
        ])
      );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError("파일을 선택해주세요."); return; }
    setUploading(true);
    setError("");
    try {
      let targetSetId: number;
      if (selectedSetId === "new") {
        if (!newSetName.trim()) { setError("세트 이름을 입력해주세요."); setUploading(false); return; }
        const res = await wordSetsApi.create(newSetName.trim());
        targetSetId = res.data.id;
      } else {
        targetSetId = selectedSetId;
      }
      if (uploadType === "quizlet") {
        await wordSetsApi.uploadQuizlet(targetSetId, file);
      } else {
        await wordSetsApi.uploadTemplate(targetSetId, file);
      }
      router.push("/words");
    } catch {
      setError("업로드 중 오류가 발생했어요. 파일 형식을 확인해주세요.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">단어 업로드</h1>
        <p className="text-sm text-slate-400 mt-1">퀴즐렛 파일 또는 앱 템플릿으로 단어를 가져오세요</p>
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

        {/* 새 세트 이름 입력 */}
        {selectedSetId === "new" && (
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">새 세트 이름</label>
            <input
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              placeholder="예: Week 4 — 고급 어휘"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        )}

        {/* 업로드 타입 */}
        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 block">파일 형식</label>
          <div className="flex gap-2">
            {(["quizlet", "template"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setUploadType(type)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  uploadType === type
                    ? "bg-primary text-white border-primary"
                    : "bg-slate-900/50 text-slate-400 border-slate-700 hover:border-slate-500"
                }`}
              >
                {type === "quizlet" ? "퀴즐렛 파일" : "앱 템플릿"}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {uploadType === "quizlet"
              ? "퀴즐렛에서 내보낸 .csv / .xlsx / .xls / .pdf 파일을 올려주세요"
              : "앱 제공 CSV 템플릿 형식의 파일을 올려주세요 (english,korean 헤더 포함)"}
          </p>
        </div>

        {/* 파일 선택 */}
        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 block">파일 선택</label>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer hover:border-primary hover:bg-slate-800 transition-all">
            <input
              type="file"
              accept={uploadType === "quizlet" ? ".csv,.xlsx,.xls,.pdf" : ".csv"}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            {file ? (
              <div className="text-center">
                <p className="text-sm font-medium text-primary">{file.name}</p>
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
                <p className="text-xs text-slate-600 mt-0.5">
                  {uploadType === "quizlet" ? ".csv, .xlsx, .xls, .pdf" : ".csv"}
                </p>
              </div>
            )}
          </label>
        </div>

        {error && <p className="text-sm text-wrong">{error}</p>}

        <button
          type="submit"
          disabled={uploading}
          className="w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-60"
        >
          {uploading ? "업로드 중..." : "업로드"}
        </button>
      </form>
    </div>
  );
}
