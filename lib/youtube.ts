// Helpers for the listening note: parse YouTube links and build/read timestamp links stored in pocket memos.

const VIDEO_ID = /^[\w-]{11}$/;

export function parseVideoId(input: string): string | null {
  const text = input.trim();
  if (VIDEO_ID.test(text)) return text;
  try {
    const url = new URL(text.startsWith("http") ? text : `https://${text}`);
    const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "");
    if (host === "youtu.be") return pick(url.pathname.slice(1));
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const v = url.searchParams.get("v");
      if (v) return pick(v);
      const [, kind, id] = url.pathname.split("/");
      if (["shorts", "live", "embed"].includes(kind)) return pick(id);
    }
  } catch {
    // not a URL
  }
  return null;
}

function pick(id: string | undefined): string | null {
  return id && VIDEO_ID.test(id) ? id : null;
}

export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

export function buildTimestampLink(videoId: string, seconds: number): string {
  return `youtu.be/${videoId}?t=${Math.floor(seconds)}`;
}

const TIMESTAMP_LINK = /(?:https?:\/\/)?youtu\.be\/([\w-]{11})\?t=(\d+)/;

export interface MemoTimestamp {
  videoId: string;
  seconds: number;
  rest: string; // memo text without the link
}

export function parseMemoTimestamp(memo: string | null | undefined): MemoTimestamp | null {
  if (!memo) return null;
  const match = memo.match(TIMESTAMP_LINK);
  if (!match) return null;
  return {
    videoId: match[1],
    seconds: Number(match[2]),
    rest: memo.replace(match[0], "").replace(/\s*·\s*$/, "").replace(/^\s*·\s*/, "").trim(),
  };
}

export function listeningHref(videoId: string, seconds: number): string {
  return `/study/listening?v=${videoId}&t=${Math.floor(seconds)}`;
}
