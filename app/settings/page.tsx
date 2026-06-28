"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { membersApi, settingsApi, authApi, autoImportApi, savedWordSetsApi, Member, SavedWordSet, AutoImportConfig, ImportHistory } from "@/lib/api";
import { clearAccessToken } from "@/lib/auth";

const AUTO_IMPORT_EMAIL = "aksdn1285@gmail.com";
const DOW_LABELS = ["", "월", "화", "수", "목", "금", "토", "일"];

type BtnState = "idle" | "loading" | "success" | "error";

function useSectionBtn(): [BtnState, (fn: () => Promise<void>) => void] {
  const [state, setState] = useState<BtnState>("idle");
  const run = (fn: () => Promise<void>) => {
    setState("loading");
    fn()
      .then(() => {
        setState("success");
        setTimeout(() => setState("idle"), 2000);
      })
      .catch(() => {
        setState("error");
        setTimeout(() => setState("idle"), 2000);
      });
  };
  return [state, run];
}

function SectionBtn({ state, label, onClick }: { state: BtnState; label: string; onClick: () => void }) {
  const labels = { idle: label, loading: "저장 중…", success: "✓ 저장 완료", error: "✗ 실패" };
  return (
    <button
      onClick={onClick}
      disabled={state === "loading"}
      className={`w-full py-3 text-sm font-bold rounded-xl transition-all duration-200 spring-active ${
        state === "success" ? "bg-correct text-white shadow-lg shadow-correct/10" :
        state === "error"   ? "bg-wrong text-white shadow-lg shadow-wrong/10" :
        state === "loading" ? "bg-primary/50 text-white cursor-not-allowed" :
        "bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/10"
      }`}
    >
      {state === "loading" ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {labels.loading}
        </span>
      ) : (
        labels[state]
      )}
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  const [nickname, setNickname] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [dailyGoal, setDailyGoal] = useState(20);
  const [randomOrder, setRandomOrder] = useState(false);

  const [savedWordSets, setSavedWordSets] = useState<SavedWordSet[]>([]);
  const [autoImportConfig, setAutoImportConfig] = useState<AutoImportConfig | null>(null);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  const [nicknameBtn, runNickname] = useSectionBtn();
  const [pwBtn, runPw] = useSectionBtn();
  const [settingsBtn, runSettings] = useSectionBtn();
  const [autoImportBtn, runAutoImport] = useSectionBtn();

  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const activeTheme = document.documentElement.classList.contains("light") ? "light" : "dark";
    setTheme(activeTheme);
  }, []);

  const toggleThemeState = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    }
  };

  useEffect(() => {
    Promise.all([membersApi.getMe(), settingsApi.get(), savedWordSetsApi.getAll().catch(() => ({ data: [] }))])
      .then(([m, s, saved]) => {
        setMember(m.data);
        setNickname(m.data.nickname);
        setDailyGoal(s.data.dailyGoal);
        setRandomOrder(s.data.shuffle);
        setSavedWordSets(saved.data);
        if (m.data.email === AUTO_IMPORT_EMAIL) {
          Promise.all([autoImportApi.getConfig(), autoImportApi.getHistory()])
            .then(([cfg, hist]) => {
              setAutoImportConfig(cfg.data);
              setImportHistory(hist.data);
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        setMember({ id: 0, nickname: "홍길동", email: "user@example.com" });
        setNickname("홍길동");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleNickname = () => runNickname(async () => {
    await membersApi.updateNickname(nickname);
  });

  const handlePassword = () => {
    setPwError("");
    if (!newPw) { setPwError("새 비밀번호를 입력해주세요"); return; }
    runPw(async () => {
      await membersApi.updatePassword(currentPw, newPw);
      setCurrentPw(""); setNewPw("");
    });
  };

  const handleSettings = () => runSettings(async () => {
    await settingsApi.update({ dailyGoal, shuffle: randomOrder });
  });

  const handleAutoImportSave = () => {
    if (!autoImportConfig) return;
    runAutoImport(async () => {
      const res = await autoImportApi.updateConfig(autoImportConfig);
      setAutoImportConfig(res.data);
    });
  };

  const handleTrigger = async () => {
    setImporting(true);
    setImportMsg("");
    try {
      const res = await autoImportApi.trigger();
      const hist = await autoImportApi.getHistory();
      setImportHistory(hist.data);
      setImportMsg(`${res.data.imported}개 클래스를 가져왔어요`);
    } catch {
      setImportMsg("임포트에 실패했어요");
    } finally {
      setImporting(false);
    }
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* noop */ }
    clearAccessToken();
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    if (!confirm("정말 탈퇴하시겠어요? 모든 데이터가 삭제됩니다.")) return;
    try {
      await membersApi.deleteMe();
      clearAccessToken();
      router.push("/login");
    } catch { /* ignore */ }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 page-in space-y-6">
      <h1 className="text-2xl font-extrabold text-foreground tracking-tight">설정</h1>

      {/* 계정 정보 */}
      <section className="glass-card rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-foreground tracking-tight">계정 정보</h2>
          {member && <p className="text-xs text-slate-400 mt-1 font-medium">{member.email}</p>}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
            className="flex-1 bg-background border border-border text-foreground rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/80 transition-colors font-medium placeholder:text-sub"
          />
          <button
            onClick={handleNickname}
            disabled={nicknameBtn === "loading"}
            className={`px-6 py-3 text-sm font-bold rounded-xl transition-all duration-200 sm:shrink-0 spring-active ${
              nicknameBtn === "success" ? "bg-correct text-white" :
              nicknameBtn === "error"   ? "bg-wrong text-white" :
              "bg-primary text-white hover:bg-primary-hover"
            }`}
          >
            {nicknameBtn === "success" ? "✓ 완료" : nicknameBtn === "error" ? "✗ 실패" : "변경"}
          </button>
        </div>
      </section>

      {/* 비밀번호 변경 */}
      <section className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-foreground tracking-tight">비밀번호 변경</h2>
        <div className="space-y-3">
          <input
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            placeholder="현재 비밀번호"
            className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/80 transition-colors font-medium placeholder:text-sub"
          />
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="새 비밀번호"
            className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/80 transition-colors font-medium placeholder:text-sub"
          />
        </div>
        {pwError && <p className="text-xs text-wrong font-semibold">⚠️ {pwError}</p>}
        <SectionBtn state={pwBtn} label="비밀번호 변경" onClick={handlePassword} />
      </section>

      {/* 학습 설정 */}
      <section className="glass-card rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-bold text-foreground tracking-tight">학습 설정</h2>
        
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <p className="text-sm font-semibold text-foreground">하루 목표 단어 수</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">플래시카드 학습 시 하루에 표시될 단어 개수</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDailyGoal((v) => Math.max(5, v - 5))}
              className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted hover:bg-primary/[0.03] hover:text-foreground transition-all spring-active font-bold cursor-pointer"
            >−</button>
            <span className="text-sm font-extrabold text-primary w-8 text-center tabular-nums">{dailyGoal}</span>
            <button
              onClick={() => setDailyGoal((v) => Math.min(100, v + 5))}
              className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted hover:bg-primary/[0.03] hover:text-foreground transition-all spring-active font-bold cursor-pointer"
            >+</button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">랜덤 순서 활성화</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">단어 목록을 학습할 때 무작위 순서로 노출합니다</p>
          </div>
          <button
            onClick={() => setRandomOrder((v) => !v)}
            className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${randomOrder ? "bg-primary" : "bg-slate-800"}`}
          >
            <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow toggle-dot ${randomOrder ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>

        <SectionBtn state={settingsBtn} label="설정 저장" onClick={handleSettings} />
      </section>

      {/* 화면 테마 설정 */}
      <section className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-foreground tracking-tight">화면 테마 설정</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">라이트 모드 적용</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">화면 테마를 어두운 색상에서 밝은 색상으로 전환합니다</p>
          </div>
          <button
            type="button"
            onClick={toggleThemeState}
            className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${theme === "light" ? "bg-primary" : "bg-slate-800"}`}
          >
            <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow toggle-dot ${theme === "light" ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
      </section>

      {/* 자동 임포트 (aksdn1285@gmail.com 전용) */}
      {member?.email === AUTO_IMPORT_EMAIL && autoImportConfig && (
        <section className="glass-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">퀴즐렛 자동 임포트</h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">fluent 수업 단어를 주기적으로 자동 연동합니다</p>
            </div>
            <button
              onClick={() => setAutoImportConfig({ ...autoImportConfig, enabled: !autoImportConfig.enabled })}
              className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${autoImportConfig.enabled ? "bg-primary" : "bg-slate-800"}`}
            >
              <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow toggle-dot ${autoImportConfig.enabled ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">연동 요일</p>
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
              {[1,2,3,4,5,6,7].map((d) => (
                <button 
                  key={d} 
                  onClick={() => setAutoImportConfig({ ...autoImportConfig, dayOfWeek: d })}
                  className={`w-9 h-9 rounded-lg text-xs font-bold transition-all shrink-0 spring-active cursor-pointer ${
                    autoImportConfig.dayOfWeek === d 
                      ? "bg-primary text-white shadow-md shadow-primary/10" 
                      : "bg-card border border-border text-muted hover:bg-primary/[0.03] hover:text-foreground"
                  }`}
                >
                  {DOW_LABELS[d]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">연동 시간</p>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setAutoImportConfig({ ...autoImportConfig, hour: Math.max(0, autoImportConfig.hour - 1) })}
                className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted hover:bg-primary/[0.03] hover:text-foreground transition-all spring-active font-bold cursor-pointer"
              >−</button>
              <span className="text-sm font-extrabold text-primary w-12 text-center tabular-nums">{String(autoImportConfig.hour).padStart(2,"0")}:00</span>
              <button 
                onClick={() => setAutoImportConfig({ ...autoImportConfig, hour: Math.min(23, autoImportConfig.hour + 1) })}
                className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-muted hover:bg-primary/[0.03] hover:text-foreground transition-all spring-active font-bold cursor-pointer"
              >+</button>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <SectionBtn state={autoImportBtn} label="설정 저장" onClick={handleAutoImportSave} />
            </div>
            <button 
              onClick={handleTrigger} 
              disabled={importing}
              className="flex-1 py-3 bg-card border border-border text-muted hover:text-foreground hover:bg-primary/[0.03] text-sm font-bold rounded-xl transition-all disabled:opacity-50 spring-active flex items-center justify-center gap-2 cursor-pointer"
            >
              {importing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  동기화 중...
                </>
              ) : (
                "수동 즉시 동기화"
              )}
            </button>
          </div>

          {importMsg && (
            <p className={`text-xs text-center font-semibold ${importMsg.includes("실패") ? "text-wrong" : "text-correct"}`}>
              {importMsg}
            </p>
          )}

          {importHistory.length > 0 && (
            <div className="pt-4 border-t border-white/[0.04]">
              <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">임포트 히스토리</p>
              <div className="space-y-2 max-h-36 overflow-y-auto scrollbar-hide pr-1">
                {importHistory.slice(0, 10).map((h) => (
                  <div key={h.externalClassId} className="flex items-center justify-between text-xs py-1 border-b border-white/[0.02]">
                    <span className="text-slate-400 truncate max-w-[65%] font-medium">{h.externalClassId}</span>
                    <span className="text-slate-500 shrink-0 tabular-nums font-semibold">{h.importedAt.slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 저장된 단어 세트 */}
      {savedWordSets.length > 0 && (
        <section className="glass-card rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-foreground tracking-tight">구독 중인 단어 세트</h2>
          <div className="space-y-1 divide-y divide-border">
            {savedWordSets.map((s) => (
              <div key={s.wordSetId} className="flex items-center justify-between py-3">
                <Link href={`/words/${s.wordSetId}`} className="text-sm font-semibold text-muted hover:text-primary transition-colors truncate flex-1 tracking-tight">
                  {s.name}
                </Link>
                <button
                  onClick={async () => {
                    await savedWordSetsApi.unsave(s.wordSetId).catch(() => {});
                    setSavedWordSets((prev) => prev.filter((x) => x.wordSetId !== s.wordSetId));
                  }}
                  className="ml-3 text-slate-500 hover:text-wrong transition-colors shrink-0 p-1 rounded-lg hover:bg-wrong/5 spring-active cursor-pointer"
                  title="세트 구독 취소"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 로그아웃 / 탈퇴 */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button 
          onClick={handleLogout}
          className="flex-1 py-3 bg-card border border-border rounded-xl text-sm font-bold text-muted hover:text-foreground hover:bg-primary/[0.03] transition-all spring-active cursor-pointer"
        >
          로그아웃
        </button>
        <button 
          onClick={handleDeleteAccount}
          className="flex-1 py-3 bg-wrong/5 hover:bg-wrong/10 text-sm font-bold text-wrong rounded-xl transition-all spring-active"
        >
          회원 탈퇴
        </button>
      </div>
    </div>
  );
}
