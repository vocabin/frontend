"use client";

import { useEffect } from "react";
import Portal from "@/components/Portal";

interface Props {
  message: string;
  onDone: () => void;
}

export default function Toast({ message, onDone }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1800);
    return () => clearTimeout(timer);
  }, [message, onDone]);

  return (
    <Portal>
      <div className="fixed left-1/2 -translate-x-1/2 bottom-28 md:bottom-10 z-50 fade-in" role="status">
        <div className="px-4 py-2.5 rounded-xl bg-slate-900/95 border border-white/[0.08] shadow-xl text-sm font-semibold text-foreground">
          {message}
        </div>
      </div>
    </Portal>
  );
}
