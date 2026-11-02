"use client";

import { useState } from "react";
import { aiApi, pocketApi, AiExplainResult, AiSuggestion, SuggestionType, Word } from "@/lib/api";
import { buildTimestampLink, formatTime } from "@/lib/youtube";
import { fieldClass, secondaryButtonClass } from "@/lib/ui";

const MAX_SENTENCE = 300;

const TYPE_LABEL: Record<SuggestionType, string> = {
  IDIOM: "숙어",
  PHRASAL_VERB: "구동사",
  EXPRESSION: "표현",
  GRAMMAR: "문법",
};

const TYPE_CLASS: Record<SuggestionType, string> = {
  IDIOM: "bg-pocket/15 text-pocket",
  PHRASAL_VERB: "bg-primary/10 text-primary",
  EXPRESSION: "bg-correct/10 text-correct",
  GRAMMAR: "bg-violet-500/10 text-violet-500",
};

interface Props {
  videoId: string;
  pauseAndGetTime: () => number | null;
  resume: () => void;
  onSaved: (words: Word[]) => void;
  onToast: (message: string) => void;
}

function errorMessage(e: unknown): string {
  const response = (e as { response?: { status?: number; data?: { message?: string } } }).response;
  switch (response?.status) {
    case 400: return response.data?.message ?? "문장을 확인해 주세요";
    case 403: return "AI 기능이 꺼져 있는 계정이에요";
    case 429: return "오늘 AI 사용 횟수를 다 썼어요. 내일 다시 쓸 수 있어요";
    case 503: return "AI가 응답하지 않아요. 잠시 후 다시 시도해 주세요";
    default:  return "표현을 뽑지 못했어요. 잠시 후 다시 시도해 주세요";
  }
}

// Example sentence + where it was heard, kept under the 500-char memo limit
function memoFor(s: AiSuggestion, link: string): string {
  const example = [s.exampleEn, s.exampleKo && `(${s.exampleKo})`].filter(Boolean).join(" ").slice(0, 440);
  return [example, link].filter(Boolean).join(" · ");
}

export default function AiExpressionPanel({ videoId, pauseAndGetTime, resume, onSaved, onToast }: Props) {
  const [open, setOpen]         = useState(false);
  const [sentence, setSentence] = useState("");
  const [heardAt, setHeardAt]   = useState<number | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [result, setResult]     = useState<AiExplainResult | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [done, setDone]         = useState<Set<number>>(new Set());
  const [saving, setSaving]     = useState(false);

  const capture = () => {
    if (heardAt === null) setHeardAt(pauseAndGetTime());
  };

  const openPanel = () => {
    setOpen(true);
    capture();
  };

  const close = () => {
    setOpen(false);
    setSentence(""); setResult(null); setHeardAt(null); setError("");
    setSelected(new Set()); setDone(new Set());
    resume();
  };

  // Only runs on an explicit tap, and only the one sentence is sent
  const ask = async () => {
    if (!sentence.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await aiApi.explain(sentence.trim());
      setResult(res.data);
      setSelected(new Set());
      setDone(new Set());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const toggle = (index: number) => {
    if (done.has(index)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  // Sequential on purpose: the first add may create the pocket set
  const save = async () => {
    if (!result || selected.size === 0 || saving) return;
    setSaving(true);
    const link = heardAt !== null ? buildTimestampLink(videoId, heardAt) : "";
    const added: Word[] = [];
    const finished = new Set(done);
    let duplicates = 0;
    for (const index of [...selected].sort((a, b) => a - b)) {
      const s = result.suggestions[index];
      try {
        const res = await pocketApi.add(s.expression.slice(0, 500), s.meaningKo.slice(0, 500), memoFor(s, link));
        added.push(res.data);
        finished.add(index);
      } catch (e) {
        if ((e as { response?: { status?: number } }).response?.status === 409) {
          duplicates++;
          finished.add(index);
        }
      }
    }
    setDone(finished);
    setSelected(new Set());
    setSaving(false);
    if (added.length > 0) onSaved(added);
    onToast(duplicates > 0 ? `${added.length}개 담았어요 · ${duplicates}개는 이미 있어요` : `${added.length}개 포켓에 담았어요`);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={openPanel}
        className="w-full mt-2 bg-card border border-border rounded-2xl p-4 flex items-center gap-3 text-left active:bg-primary/[0.04] transition-colors"
      >
        <span className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg" aria-hidden>✦</span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold text-foreground">AI로 표현 뽑기</span>
          <span className="block text-xs text-muted mt-0.5">모르는 문장을 넣으면 숙어·표현·시제를 골라줘요</span>
        </span>
      </button>
    );
  }

  return (
    <div className="mt-2 bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-foreground"><span className="text-primary">✦</span> AI로 표현 뽑기</p>
        <button type="button" onClick={close} className="h-9 px-2 text-xs font-bold text-sub">닫기</button>
      </div>

      <textarea
        value={sentence}
        onChange={(e) => setSentence(e.target.value)}
        onFocus={capture}
        placeholder="이해 못 한 문장 하나를 입력하세요"
        maxLength={MAX_SENTENCE}
        rows={3}
        autoCapitalize="none"
        autoCorrect="off"
        className={`${fieldClass} resize-none leading-relaxed`}
      />
      <div className="flex items-center justify-between mt-1.5 text-[11px] text-sub tabular-nums">
        <span>{heardAt !== null ? `⏱ ${formatTime(heardAt)}에 들은 문장` : "영상 없이도 쓸 수 있어요"}</span>
        <span>{sentence.length}/{MAX_SENTENCE}</span>
      </div>

      {error && <p className="text-sm font-semibold text-wrong mt-2">{error}</p>}

      <button
        type="button"
        onClick={ask}
        disabled={!sentence.trim() || loading}
        className="w-full h-12 mt-3 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors spring-active disabled:opacity-40"
      >
        {loading ? "표현을 고르는 중…" : result ? "다시 뽑기" : "표현 뽑기"}
      </button>

      {result && (
        <div className="mt-4 fade-in">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-muted">몰랐던 표현을 골라 담으세요</p>
            <p className="text-[11px] text-sub">
              {result.cached ? "저장된 결과 · 무료" : `오늘 남은 횟수 ${result.remainingToday}`}
            </p>
          </div>

          {result.suggestions.length === 0 ? (
            <p className="text-sm text-muted text-center py-6">이 문장에서는 따로 외울 표현이 없어요</p>
          ) : (
            <ul className="space-y-2">
              {result.suggestions.map((s, i) => {
                const isDone = done.has(i);
                const isSelected = selected.has(i);
                return (
                  <li key={`${s.expression}-${i}`}>
                    <button
                      type="button"
                      onClick={() => toggle(i)}
                      disabled={isDone}
                      aria-pressed={isSelected}
                      className={`w-full text-left rounded-xl border p-3 flex gap-3 transition-colors ${
                        isSelected ? "border-primary bg-primary/[0.05]" : "border-border bg-background"
                      } ${isDone ? "opacity-50" : ""}`}
                    >
                      <span
                        aria-hidden
                        className={`mt-0.5 w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                          isDone ? "border-correct bg-correct text-white" : isSelected ? "border-primary bg-primary text-white" : "border-border"
                        }`}
                      >
                        {(isDone || isSelected) && "✓"}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-foreground break-words">{s.expression}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${TYPE_CLASS[s.type]}`}>{TYPE_LABEL[s.type]}</span>
                          {isDone && <span className="text-[10px] font-bold text-correct">담음</span>}
                        </span>
                        <span className="block text-sm text-muted mt-0.5 break-words">{s.meaningKo}</span>
                        {s.exampleEn && (
                          <span className="block text-xs text-sub mt-1.5 break-words">
                            {s.exampleEn}
                            {s.exampleKo && <span className="block">{s.exampleKo}</span>}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {result.suggestions.length > 0 && (
            <div className="grid grid-cols-[auto_1fr] gap-2 mt-3">
              <button type="button" onClick={close} className={`h-12 px-4 rounded-xl text-sm font-bold ${secondaryButtonClass}`}>
                완료
              </button>
              <button
                type="button"
                onClick={save}
                disabled={selected.size === 0 || saving}
                className="h-12 rounded-xl text-sm font-bold bg-pocket text-white transition-colors spring-active disabled:opacity-40"
              >
                {saving ? "담는 중…" : `선택한 ${selected.size}개 포켓에 담기`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
