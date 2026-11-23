"use client";

import { useCallback, useSyncExternalStore } from "react";

const CHANGE_EVENT = "vocabin:stored-flag";

function read(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

// A boolean remembered on this device (localStorage), safe for server rendering (false until hydrated)
export function useStoredFlag(key: string): [boolean, (value: boolean) => void] {
  const value = useSyncExternalStore(subscribe, () => read(key), () => false);
  const setValue = useCallback((next: boolean) => {
    try {
      if (next) localStorage.setItem(key, "1");
      else localStorage.removeItem(key);
    } catch {
      // storage unavailable: the value just does not persist
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, [key]);
  return [value, setValue];
}
