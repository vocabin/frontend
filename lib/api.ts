import api from "./axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WordSet {
  id: number;
  name: string;
  createdAt: string;
}

export interface Word {
  id: number;
  english: string;
  korean: string;
  wordSetId: number;
}

export interface StatsSummary {
  totalWords: number;
  correctRate: number; // 0.0 ~ 1.0
  streakDays: number;
  totalRecords: number;
}

export interface WeeklyDay {
  date: string;
  total: number;
  correct: number;
  correctRate: number;
}

export interface WeeklyStats {
  days: WeeklyDay[];
}

export interface CalendarStats {
  studiedDates: string[];
}

export interface WordSetProgress {
  wordSetId: number;
  name: string;
  totalWords: number;
  studiedWords: number;
}

export interface StudyRecord {
  wordId: number;
  correct: boolean;
  mode: "FLASHCARD" | "SPEEDRUN" | "WEAK";
}

export interface Member {
  id: number;
  nickname: string;
  email: string;
}

export interface Settings {
  dailyGoal: number;
  shuffle: boolean;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ accessToken: string }>("/api/auth/login", { email, password }),

  register: (nickname: string, email: string, password: string) =>
    api.post("/api/auth/register", { nickname, email, password }),

  logout: () => api.post("/api/auth/logout"),
};

// ─── Word Sets ────────────────────────────────────────────────────────────────

export const wordSetsApi = {
  getAll: () => api.get<WordSet[]>("/api/word-sets"),

  create: (name: string) => api.post<WordSet>("/api/word-sets", { name }),

  delete: (wordSetId: number) => api.delete(`/api/word-sets/${wordSetId}`),

  getProgress: () => api.get<WordSetProgress[]>("/api/word-sets/progress"),

  uploadQuizlet: (wordSetId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/api/word-sets/${wordSetId}/upload/quizlet`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  uploadTemplate: (wordSetId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/api/word-sets/${wordSetId}/upload/template`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  uploadHackers: (wordSetId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/api/word-sets/${wordSetId}/upload/hackers`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ─── Words ────────────────────────────────────────────────────────────────────

export const wordsApi = {
  getByWordSet: (wordSetId: number) =>
    api.get<Word[]>(`/api/word-sets/${wordSetId}/words`),

  getDue: () => api.get<Word[]>("/api/words/due"),

  getRandom: () => api.get<Word[]>("/api/words/random"),

  getWeak: (wordSetId?: number) =>
    api.get<Word[]>("/api/words/weak", {
      params: wordSetId ? { wordSetId } : undefined,
    }),

  update: (wordId: number, english: string, korean: string) =>
    api.put<Word>(`/api/words/${wordId}`, { english, korean }),

  delete: (wordId: number) => api.delete(`/api/words/${wordId}`),
};

// ─── Study ────────────────────────────────────────────────────────────────────

export const studyApi = {
  recordResult: (record: StudyRecord) =>
    api.post("/api/study/records", record),
};

// ─── Stats ────────────────────────────────────────────────────────────────────

export const statsApi = {
  getSummary: () => api.get<StatsSummary>("/api/stats/summary"),

  getWeekly: () => api.get<WeeklyStats>("/api/stats/weekly"),

  getCalendar: (year: number, month: number) =>
    api.get<CalendarStats>("/api/stats/calendar", {
      params: { year, month },
    }),
};

// ─── Members ──────────────────────────────────────────────────────────────────

export const membersApi = {
  getMe: () => api.get<Member>("/api/members/me"),

  updateNickname: (nickname: string) =>
    api.put("/api/members/me/nickname", { nickname }),

  updatePassword: (currentPassword: string, newPassword: string) =>
    api.put("/api/members/me/password", { currentPassword, newPassword }),

  deleteMe: () => api.delete("/api/members/me"),
};

// ─── Settings ─────────────────────────────────────────────────────────────────

export const settingsApi = {
  get: () => api.get<Settings>("/api/settings"),

  update: (settings: Settings) => api.put("/api/settings", settings),
};

// ─── Saved Word Sets ──────────────────────────────────────────────────────────

export interface SavedWordSet {
  wordSetId: number;
  name: string;
  savedAt: string;
}

export const savedWordSetsApi = {
  getAll: () => api.get<SavedWordSet[]>("/api/word-sets/saved"),

  isSaved: (wordSetId: number) =>
    api.get<{ saved: boolean }>(`/api/word-sets/${wordSetId}/saved`),

  save: (wordSetId: number) =>
    api.post<SavedWordSet>(`/api/word-sets/${wordSetId}/save`),

  unsave: (wordSetId: number) =>
    api.delete(`/api/word-sets/${wordSetId}/save`),
};

// ─── Study Bookmark ───────────────────────────────────────────────────────────

export interface StudyBookmark {
  wordSetId: number;
  wordIndex: number;
  updatedAt: string;
}

export const studyBookmarkApi = {
  get: (wordSetId: number) =>
    api.get<StudyBookmark>(`/api/word-sets/${wordSetId}/bookmark`),

  upsert: (wordSetId: number, wordIndex: number) =>
    api.put<StudyBookmark>(`/api/word-sets/${wordSetId}/bookmark`, { wordIndex }),
};

// ─── Auto Import ──────────────────────────────────────────────────────────────

export interface AutoImportConfig {
  dayOfWeek: number; // 1=Mon, 7=Sun
  hour: number;      // 0-23
  enabled: boolean;
}

export interface ImportHistory {
  externalClassId: string;
  wordSetId: number;
  importedAt: string;
}

export const autoImportApi = {
  getConfig: () => api.get<AutoImportConfig>("/api/auto-import/config"),

  updateConfig: (config: AutoImportConfig) =>
    api.put<AutoImportConfig>("/api/auto-import/config", config),

  trigger: () => api.post<{ imported: number }>("/api/auto-import/trigger"),

  getHistory: () => api.get<ImportHistory[]>("/api/auto-import/history"),
};
