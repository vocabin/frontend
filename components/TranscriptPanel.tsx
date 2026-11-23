"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TranscriptSentence } from "@/lib/api";
import { formatTime } from "@/lib/youtube";
import { secondaryButtonClass } from "@/lib/ui";
import { useStoredFlag } from "@/lib/useStoredFlag";

const MAX_SELECTED_SENTENCES = 3;
const FOLLOW_PAUSE_MS = 4000; // stop auto-scrolling for a moment after the user scrolls the list
const ACTION_BAR_SPACE = 180;  // floating action bar + bottom tab bar, measured from the bottom of the screen
const EXPANDED_KEY = "listening:transcriptExpanded";
const AI_SENTENCE_LIMIT = 300; // the AI accepts up to 300 characters

// Joins whole sentences up to the limit, dropping trailing ones instead of cutting a sentence in half
function joinWithinLimit(sentences: string[]): string {
  let text = "";
  for (const sentence of sentences) {
    const next = text ? `${text} ${sentence}` : sentence;
    if (next.length > AI_SENTENCE_LIMIT) break;
    text = next;
  }
  return text || sentences[0].slice(0, AI_SENTENCE_LIMIT);
}

export interface LoopRange {
  start: number;
  end: number;
}

interface Props {
  lines: TranscriptSentence[];
  generated: boolean;
  currentTime: number;
  loop: LoopRange | null;
  onPlayFrom: (seconds: number) => void;
  onLoop: (range: LoopRange | null) => void;
  onAskAi: (sentence: string, seconds: number) => void;
}

interface Selection {
  anchor: number;
  from: number;
  to: number;
}

export default function TranscriptPanel({ lines, generated, currentTime, loop, onPlayFrom, onLoop, onAskAi }: Props) {
  const [selection, setSelection] = useState<Selection | null>(null);
  // Collapsed by default so the page stays short; the last choice is remembered on this device
  const [expanded, setExpanded] = useStoredFlag(EXPANDED_KEY);
  const listRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastUserScrollRef = useRef(0);

  const activeIndex = useMemo(() => {
    let index = -1;
    for (let i = 0; i < lines.length && lines[i].start <= currentTime; i++) index = i;
    return index;
  }, [lines, currentTime]);

  const toggleExpanded = () => {
    if (expanded) setSelection(null);
    setExpanded(!expanded);
  };

  // Keep the line being spoken in view, unless the user is browsing the list or has a selection
  useEffect(() => {
    const list = listRef.current;
    const row = rowRefs.current[activeIndex];
    if (!list || !row || selection) return;
    if (Date.now() - lastUserScrollRef.current < FOLLOW_PAUSE_MS) return;
    list.scrollTo({ top: row.offsetTop - list.clientHeight / 3, behavior: "smooth" });
  }, [activeIndex, selection, expanded]);

  // Lift the picked line above the floating action bar so the next line stays tappable too
  const keepAboveActionBar = (index: number) => {
    setTimeout(() => {
      const row = rowRefs.current[index];
      if (!row || window.matchMedia("(min-width: 768px)").matches) return;
      const overlap = row.getBoundingClientRect().bottom + row.offsetHeight - (window.innerHeight - ACTION_BAR_SPACE);
      if (overlap > 0) window.scrollBy({ top: overlap, behavior: "smooth" });
    }, 0);
  };

  const select = (index: number) => {
    keepAboveActionBar(index);
    setSelection((current) => {
      if (!current) return { anchor: index, from: index, to: index };
      if (current.from === current.to && current.from === index) return null;
      const from = Math.min(current.anchor, index);
      const to = Math.max(current.anchor, index);
      // Keep the phrase short enough to be one or two sentences
      if (to - from + 1 > MAX_SELECTED_SENTENCES) return { anchor: index, from: index, to: index };
      return { ...current, from, to };
    });
  };

  const selected = selection ? lines.slice(selection.from, selection.to + 1) : [];
  const selectedText = selected.map((line) => line.text).join(" ").replace(/\s+/g, " ").trim();
  const selectedRange: LoopRange | null = selected.length
    ? { start: selected[0].start, end: selected[selected.length - 1].end }
    : null;
  const loopingSelection = loop && selectedRange && Math.abs(loop.start - selectedRange.start) < 0.01;

  return (
    <section aria-labelledby="transcript-title" className="mt-2 bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between gap-2 pl-4 pr-2 pt-2 pb-1">
        <h2 id="transcript-title" className="text-sm font-bold text-foreground">
          자막 스크립트
          {generated && <span className="ml-2 text-[11px] font-semibold text-sub">자동 생성</span>}
        </h2>
        <div className="flex items-center gap-1">
          {loop && (
            <button type="button" onClick={() => onLoop(null)} className="h-11 px-3 rounded-full bg-pocket/15 text-pocket text-xs font-bold">
              반복 중 · 끄기
            </button>
          )}
          <button
            type="button"
            onClick={toggleExpanded}
            aria-expanded={expanded}
            aria-controls="transcript-lines"
            className="h-11 px-3 rounded-xl text-sm font-bold text-primary"
          >
            {expanded ? "접기 ▴" : "펼치기 ▾"}
          </button>
        </div>
      </div>

      {!expanded && (
        // Collapsed: just the line being spoken; tapping it opens the full script
        <button
          type="button"
          onClick={toggleExpanded}
          className="w-full text-left flex gap-3 px-4 pb-3 pt-1 min-h-11"
        >
          <span className="shrink-0 w-11 pt-0.5 text-xs tabular-nums text-primary font-bold">
            {activeIndex >= 0 ? formatTime(lines[activeIndex].start) : "0:00"}
          </span>
          <span className="flex-1 text-[15px] leading-snug text-foreground line-clamp-2">
            {activeIndex >= 0 ? lines[activeIndex].text : lines[0]?.text}
          </span>
        </button>
      )}

      <div
        id="transcript-lines"
        hidden={!expanded}
        ref={listRef}
        onScroll={() => { lastUserScrollRef.current = Date.now(); }}
        onTouchMove={() => { lastUserScrollRef.current = Date.now(); }}
        className="relative max-h-[42vh] overflow-y-auto px-2 pb-2"
      >
        {lines.map((line, index) => {
          const isActive = index === activeIndex;
          const isSelected = selection !== null && index >= selection.from && index <= selection.to;
          return (
            <button
              key={`${line.start}-${index}`}
              ref={(el) => { rowRefs.current[index] = el; }}
              type="button"
              onClick={() => select(index)}
              aria-pressed={isSelected}
              className={`w-full text-left flex gap-3 px-2 py-2.5 rounded-xl transition-colors ${
                isSelected ? "bg-pocket/25 ring-1 ring-pocket/60" : isActive ? "bg-primary/10" : "active:bg-primary/[0.05]"
              }`}
            >
              <span className={`shrink-0 w-11 pt-0.5 text-xs tabular-nums ${isActive ? "text-primary font-bold" : "text-sub"}`}>
                {formatTime(line.start)}
              </span>
              <span className={`flex-1 text-[15px] leading-snug break-words ${isActive || isSelected ? "text-foreground font-semibold" : "text-muted"}`}>
                {line.text}
              </span>
            </button>
          );
        })}
      </div>

      {expanded && selection && selectedRange && (
        // Floats just above the bottom tab bar on phones (inline under the list on wider screens),
        // so the actions are always visible right after picking a line
        <div
          className="fixed left-3 right-3 z-50 rounded-2xl border border-border bg-card shadow-2xl px-3 py-3 fade-in md:static md:rounded-none md:border-x-0 md:border-b-0 md:shadow-none"
          style={{ bottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <p className="hidden md:block text-sm text-foreground leading-snug line-clamp-2 mb-2.5">{selectedText}</p>
          <div className="grid grid-cols-[auto_auto_1fr_auto] gap-2">
            <button type="button" onClick={() => onPlayFrom(selectedRange.start)} aria-label="이 문장부터 재생" className={`h-11 px-3 rounded-xl text-sm font-bold ${secondaryButtonClass}`}>
              ▶
            </button>
            <button
              type="button"
              onClick={() => onLoop(loopingSelection ? null : selectedRange)}
              aria-pressed={!!loopingSelection}
              className={`h-11 px-3 rounded-xl text-sm font-bold ${loopingSelection ? "bg-pocket text-white" : secondaryButtonClass}`}
            >
              🔁 {loopingSelection ? "반복 끄기" : "반복"}
            </button>
            <button
              type="button"
              onClick={() => { onAskAi(joinWithinLimit(selected.map((line) => line.text.trim())), selectedRange.start); setSelection(null); }}
              className="h-11 rounded-xl text-sm font-bold bg-primary text-white spring-active"
            >
              ✦ AI로 풀기
            </button>
            <button type="button" onClick={() => setSelection(null)} aria-label="선택 해제" className={`w-11 h-11 rounded-xl text-sm font-bold ${secondaryButtonClass}`}>
              ✕
            </button>
          </div>
          <p className="hidden md:block text-[11px] text-sub mt-2">이어지는 문장을 더 누르면 최대 {MAX_SELECTED_SENTENCES}문장까지 함께 고를 수 있어요</p>
        </div>
      )}
    </section>
  );
}
