import api from "./axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WordSet {
  id: number;
  name: string;
  wordCount: number;
  learnedCount: number;
  correctRate: number;
}

export interface Word {
  id: number;
  term: string;
  definition: string;
  wordSetId: number;
  weakCount: number;
}

export interface StatsSummary {
  todayReviewCount: number;
  weeklyCorrectRate: number;
  streakDays: number;
  totalWords: number;
  totalSessions: number;
  totalCorrectRate: number;
}

export interface WeeklyStats {
  day: string;
  correctRate: number;
}

export interface CalendarEntry {
  date: string;
  sessionCount: number;
}

export interface WordSetProgress {
  wordSetId: number;
  wordSetName: string;
  totalWords: number;
  learnedWords: number;
  correctRate: number;
}

export interface StudyRecord {
  wordId: number;
  correct: boolean;
  mode: "FLASHCARD" | "SPEEDRUN";
}

export interface Member {
  nickname: string;
  email: string;
}

export interface Settings {
  dailyGoal: number;
  randomOrder: boolean;
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
};

// ─── Words ────────────────────────────────────────────────────────────────────

export const wordsApi = {
  getByWordSet: (wordSetId: number) =>
    api.get<Word[]>(`/api/word-sets/${wordSetId}/words`),

  getWeak: (wordSetId?: number) =>
    api.get<Word[]>("/api/words/weak", {
      params: wordSetId ? { wordSetId } : undefined,
    }),

  update: (wordId: number, term: string, definition: string) =>
    api.put<Word>(`/api/words/${wordId}`, { term, definition }),

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

  getWeekly: () => api.get<WeeklyStats[]>("/api/stats/weekly"),

  getCalendar: (year: number, month: number) =>
    api.get<CalendarEntry[]>("/api/stats/calendar", {
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
