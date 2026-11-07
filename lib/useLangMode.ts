"use client";

import { useCallback, useEffect, useState } from "react";

export type LangMode = "ko-en" | "en-ko";

const STORAGE_KEY = "study:langMode";

// Default: see the Korean meaning and recall the English. The last choice is remembered on this device
// and shared by the flashcard, set flashcard and pocket review screens.
export function useLangMode(): [LangMode, () => void] {
  const [mode, setMode] = useState<LangMode>("ko-en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "ko-en" || saved === "en-ko") setMode(saved);
    } catch {
      // storage unavailable (private mode): keep the default
    }
  }, []);

  const toggle = useCallback(() => {
    setMode((current) => {
      const next = current === "ko-en" ? "en-ko" : "ko-en";
      try { localStorage.setItem(STORAGE_KEY, next); } catch { /* storage unavailable */ }
      return next;
    });
  }, []);

  return [mode, toggle];
}
