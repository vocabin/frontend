"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { membersApi, settingsApi, authApi, Member, Settings } from "@/lib/api";
import { clearAccessToken } from "@/lib/auth";

export default function SettingsPage() {
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const [nickname, setNickname] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [dailyGoal, setDailyGoal] = useState(20);
  const [randomOrder, setRandomOrder] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    Promise.all([membersApi.getMe(), settingsApi.get()])
      .then(([m, s]) => {
        setMember(m.data);
        setNickname(m.data.nickname);
        setSettings(s.data);
        setDailyGoal(s.data.dailyGoal);
        setRandomOrder(s.data.randomOrder);
      })
      .catch(() => {
        setMember({ nickname: "홍길동", email: "user@example.com" });
        setNickname("홍길동");
        setSettings({ dailyGoal: 20, randomOrder: false });
        setDailyGoal(20);
        setRandomOrder(false);
      })
      .finally(() => setLoading(false));
  }, []);

  const flash = (type: "success" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 2500);
  };

  const handleNickname = async () => {
    try {
      await membersApi.updateNickname(nickname);
      flash("success", "닉네임이 변경되었어요");
    } catch {
      flash("error", "닉네임 변경에 실패했어요");
    }
  };

  const handlePassword = async () => {
    if (!newPw) return flash("error", "새 비밀번호를 입력해주세요");
    try {
      await membersApi.updatePassword(currentPw, newPw);
      setCurrentPw(""); setNewPw("");
      flash("success", "비밀번호가 변경되었어요");
    } catch {
      flash("error", "비밀번호 변경에 실패했어요");
    }
  };

  const handleSettings = async () => {
    try {
      await settingsApi.update({ dailyGoal, randomOrder });
      flash("success", "설정이 저장되었어요");
    } catch {
      flash("error", "설정 저장에 실패했어요");
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
    } catch {
      flash("error", "회원 탈퇴에 실패했어요");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">설정</h1>

      {/* 토스트 메시지 */}
      {msg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg transition-all ${msg.type === "success" ? "bg-correct text-white" : "bg-wrong text-white"}`}>
          {msg.text}
        </div>
      )}

      {/* 계정 정보 */}
      <div className="bg-card rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">계정 정보</h2>
        {member && (
          <p className="text-xs text-slate-500">{member.email}</p>
        )}
        <div className="flex gap-2">
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임"
            className="flex-1 bg-slate-900/50 border border-slate-700 text-foreground rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
          />
          <button
            onClick={handleNickname}
            className="px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-hover transition-colors"
          >
            변경
          </button>
        </div>
      </div>

      {/* 비밀번호 변경 */}
      <div className="bg-card rounded-2xl p-5 space-y-3">
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
        <button
          onClick={handlePassword}
          className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-hover transition-colors"
        >
          비밀번호 변경
        </button>
      </div>

      {/* 학습 설정 */}
      <div className="bg-card rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">학습 설정</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-300">하루 목표 단어 수</p>
            <p className="text-xs text-slate-500 mt-0.5">매일 학습할 목표 단어 수</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDailyGoal((v) => Math.max(5, v - 5))}
              className="w-7 h-7 rounded-lg border border-slate-700 flex items-center justify-center text-slate-400 hover:bg-slate-800 transition-colors"
            >−</button>
            <span className="text-sm font-bold text-primary w-8 text-center">{dailyGoal}</span>
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
        <button
          onClick={handleSettings}
          className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-hover transition-colors"
        >
          저장
        </button>
      </div>

      {/* 로그아웃 / 탈퇴 */}
      <div className="space-y-2">
        <button
          onClick={handleLogout}
          className="w-full py-3 border border-slate-700 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800/50 transition-colors"
        >
          로그아웃
        </button>
        <button
          onClick={handleDeleteAccount}
          className="w-full py-3 text-sm font-medium text-wrong hover:bg-wrong/5 rounded-xl transition-colors"
        >
          회원 탈퇴
        </button>
      </div>
    </div>
  );
}
