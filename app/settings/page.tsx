"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { membersApi, settingsApi, authApi, autoImportApi, Member, Settings, AutoImportConfig, ImportHistory } from "@/lib/api";
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
  const labels = { idle: label, loading: "저장 중…", success: "✓ 저장됨", error: "✗ 실패" };
  return (
    <button
      onClick={onClick}
      disabled={state === "loading"}
      className={`w-full py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
        state === "success" ? "bg-correct text-white" :
        state === "error"   ? "bg-wrong text-white" :
        state === "loading" ? "bg-primary/60 text-white cursor-not-allowed" :
        "bg-primary text-white hover:bg-primary-hover"
      }`}
    >
      {state === "loading"
        ? <span className="flex items-center justify-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{labels.loading}</span>
        : labels[state]
      }
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

  const [autoImportConfig, setAutoImportConfig] = useState<AutoImportConfig | null>(null);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  const [nicknameBtn, runNickname] = useSectionBtn();
  const [pwBtn, runPw] = useSectionBtn();
  const [settingsBtn, runSettings] = useSectionBtn();
  const [autoImportBtn, runAutoImport] = useSectionBtn();

  useEffect(() => {
    Promise.all([membersApi.getMe(), settingsApi.get()])
      .then(([m, s]) => {
        setMember(m.data);
        setNickname(m.data.nickname);
        setDailyGoal(s.data.dailyGoal);
        setRandomOrder(s.data.shuffle);
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
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-5">
      <h1 className="text-2xl font-bold text-foreground">설정</h1>

      {/* 계정 정보 */}
      <section className="bg-card rounded-2xl p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">계정 정보</h2>
          {member && <p className="text-xs text-slate-500 mt-0.5">{member.email}</p>}
        </div>
        <div className="flex gap-2">
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
            className="flex-1 bg-slate-900/50 border border-slate-700 text-foreground rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
          />
          <button
            onClick={handleNickname}
            disabled={nicknameBtn === "loading"}
            className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 shrink-0 ${
              nicknameBtn === "success" ? "bg-correct text-white" :
              nicknameBtn === "error"   ? "bg-wrong text-white" :
              "bg-primary text-white hover:bg-primary-hover"
            }`}
          >
            {nicknameBtn === "success" ? "✓" : nicknameBtn === "error" ? "✗" : "변경"}
          </button>
        </div>
      </section>

      {/* 비밀번호 변경 */}
      <section className="bg-card rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">비밀번호 변경</h2>
        <input
          type="password"
          value={currentPw}
          onChange={(e) => setCurrentPw(e.target.value)}
          placeholder="현재 비밀번호"
          className="w-full bg-slate-900/50 border border-slate-700 text-foreground rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
        />
        <input
          type="password"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          placeholder="새 비밀번호"
          className="w-full bg-slate-900/50 border border-slate-700 text-foreground rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
        />
        {pwError && <p className="text-xs text-wrong">{pwError}</p>}
        <SectionBtn state={pwBtn} label="비밀번호 변경" onClick={handlePassword} />
      </section>

      {/* 학습 설정 */}
      <section className="bg-card rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">학습 설정</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-300">하루 목표 단어 수</p>
            <p className="text-xs text-slate-500 mt-0.5">플래시카드에서 하루 학습할 단어 수</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDailyGoal((v) => Math.max(5, v - 5))}
              className="w-7 h-7 rounded-lg border border-slate-700 flex items-center justify-center text-slate-400 hover:bg-slate-800 transition-colors"
            >−</button>
            <span className="text-sm font-bold text-primary w-8 text-center tabular-nums">{dailyGoal}</span>
            <button
              onClick={() => setDailyGoal((v) => Math.min(100, v + 5))}
              className="w-7 h-7 rounded-lg border border-slate-700 flex items-center justify-center text-slate-400 hover:bg-slate-800 transition-colors"
            >+</button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-300">랜덤 순서</p>
            <p className="text-xs text-slate-500 mt-0.5">단어를 무작위 순서로 학습</p>
          </div>
          <button
            onClick={() => setRandomOrder((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${randomOrder ? "bg-primary" : "bg-slate-700"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${randomOrder ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
        <SectionBtn state={settingsBtn} label="저장" onClick={handleSettings} />
      </section>

      {/* 자동 임포트 (aksdn1285@gmail.com 전용) */}
      {member?.email === AUTO_IMPORT_EMAIL && autoImportConfig && (
        <section className="bg-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">퀴즐렛 자동 임포트</h2>
              <p className="text-xs text-slate-500 mt-0.5">fluent 수업 단어를 자동으로 가져와요</p>
            </div>
            <button
              onClick={() => setAutoImportConfig({ ...autoImportConfig, enabled: !autoImportConfig.enabled })}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${autoImportConfig.enabled ? "bg-primary" : "bg-slate-700"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${autoImportConfig.enabled ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">요일</p>
            <div className="flex gap-1">
              {[1,2,3,4,5,6,7].map((d) => (
                <button key={d} onClick={() => setAutoImportConfig({ ...autoImportConfig, dayOfWeek: d })}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${autoImportConfig.dayOfWeek === d ? "bg-primary text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
                  {DOW_LABELS[d]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">시간</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setAutoImportConfig({ ...autoImportConfig, hour: Math.max(0, autoImportConfig.hour - 1) })}
                className="w-7 h-7 rounded-lg border border-slate-700 flex items-center justify-center text-slate-400 hover:bg-slate-800 transition-colors">−</button>
              <span className="text-sm font-bold text-primary w-12 text-center tabular-nums">{String(autoImportConfig.hour).padStart(2,"0")}:00</span>
              <button onClick={() => setAutoImportConfig({ ...autoImportConfig, hour: Math.min(23, autoImportConfig.hour + 1) })}
                className="w-7 h-7 rounded-lg border border-slate-700 flex items-center justify-center text-slate-400 hover:bg-slate-800 transition-colors">+</button>
            </div>
          </div>

          <div className="flex gap-2">
            <SectionBtn state={autoImportBtn} label="저장" onClick={handleAutoImportSave} />
            <button onClick={handleTrigger} disabled={importing}
              className="flex-1 py-2.5 bg-slate-700 text-slate-200 text-sm font-medium rounded-xl hover:bg-slate-600 transition-colors disabled:opacity-50">
              {importing ? <span className="flex items-center justify-center gap-1.5"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>가져오는 중</span> : "지금 가져오기"}
            </button>
          </div>

          {importMsg && (
            <p className={`text-xs text-center ${importMsg.includes("실패") ? "text-wrong" : "text-correct"}`}>{importMsg}</p>
          )}

          {importHistory.length > 0 && (
            <div className="pt-3 border-t border-slate-700/50">
              <p className="text-xs text-slate-500 mb-2">임포트 이력</p>
              <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-hide">
                {importHistory.slice(0, 10).map((h) => (
                  <div key={h.externalClassId} className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 truncate max-w-[65%]">{h.externalClassId}</span>
                    <span className="text-slate-600 shrink-0 tabular-nums">{h.importedAt.slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 로그아웃 / 탈퇴 */}
      <div className="space-y-2 pt-1">
        <button onClick={handleLogout}
          className="w-full py-3 border border-slate-700 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800/50 transition-colors">
          로그아웃
        </button>
        <button onClick={handleDeleteAccount}
          className="w-full py-3 text-sm font-medium text-wrong hover:bg-wrong/5 rounded-xl transition-colors">
          회원 탈퇴
        </button>
      </div>
    </div>
  );
}
