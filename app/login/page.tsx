"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api";
import { setAccessToken } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      setAccessToken(res.data.accessToken);
      router.push(redirect);
    } catch {
      setError("이메일 또는 비밀번호가 올바르지 않아요");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden shadow-lg shadow-primary/20">
            <img src="/icon.svg" alt="Vocabin Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Vocabin</h1>
          <p className="text-sm text-slate-400 mt-1">영단어를 꾸준히 복습하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {error && <p className="text-sm text-wrong">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          아직 계정이 없으신가요?{" "}
          <Link href="/register" className="text-primary font-medium hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
