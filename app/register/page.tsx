"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { setAccessToken } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("비밀번호는 8자 이상이어야 해요"); return; }
    setLoading(true);
    try {
      await authApi.register(nickname, email, password);
      const loginRes = await authApi.login(email, password);
      setAccessToken(loginRes.data.accessToken);
      router.push("/");
    } catch {
      setError("회원가입에 실패했어요. 이미 사용 중인 이메일일 수 있어요");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background relative overflow-hidden">
      {/* 백그라운드 디자인 데코 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[390px] z-10">
        <div className="glass-card rounded-3xl p-8 shadow-2xl relative border-white/[0.04] bg-[#0E111E]/70">
          {/* 로고 */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center mx-auto mb-4 overflow-hidden shadow-lg shadow-primary/20 p-2.5">
              <img src="/icon.svg" alt="Vocabin Logo" className="w-full h-full object-contain filter invert" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Vocabin 회원가입</h1>
            <p className="text-xs text-slate-400 mt-2 font-medium">단어를 체계적으로 복습할 수 있는 계정을 만드세요</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-2 block tracking-wide">닉네임</label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="홍길동"
                required
                className="w-full bg-slate-950/60 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-slate-600 focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/30 transition-all font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-2 block tracking-wide">이메일 주소</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                className="w-full bg-slate-950/60 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-slate-600 focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/30 transition-all font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-2 block tracking-wide">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8자 이상 입력해주세요"
                required
                className="w-full bg-slate-950/60 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-slate-600 focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/30 transition-all font-medium"
              />
            </div>

            {error && (
              <p className="text-xs text-wrong font-semibold flex items-center gap-1.5 pt-1">
                ⚠️ {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-primary/10 transition-all disabled:opacity-60 spring-active mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  가입하는 중...
                </>
              ) : (
                "회원가입"
              )}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6 font-medium">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-primary font-bold hover:text-blue-400 hover:underline transition-colors ml-1">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
