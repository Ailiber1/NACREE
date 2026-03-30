"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const configured = isSupabaseConfigured();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) {
      setError("Supabaseが設定されていません。.env.local を設定してください。");
      return;
    }
    setError(null);
    setLoading(true);

    if (!fullName.trim() || fullName.trim().length > 100) {
      setError("お名前を1〜100文字で入力してください");
      setLoading(false);
      return;
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) || email.length > 254) {
      setError("正しいメールアドレスを入力してください");
      setLoading(false);
      return;
    }
    if (password.length < 8 || password.length > 72) {
      setError("パスワードは8〜72文字で入力してください");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: "customer",
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: "var(--color-warm-ivory)",
          padding: "24px",
        }}
      >
        <div className="w-full max-w-sm text-center">
          <h1
            className="text-3xl font-semibold mb-4 tracking-wide"
            style={{
              fontFamily: "'Noto Serif JP', serif",
              color: "var(--color-deep-charcoal)",
            }}
          >
            登録完了
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--color-muted)" }}>
            確認メールをお送りしました。メール内のリンクをクリックしてアカウントを有効化してください。
          </p>
          <p className="text-xs mb-6" style={{ color: "var(--color-antique-gold)" }}>
            有効化後、ログインすると予約手続きに戻ります。
          </p>
          <Link
            href={typeof window !== "undefined" && sessionStorage.getItem("booking_menu") ? "/auth/login?redirect=/book/confirm" : "/auth/login"}
            className="inline-block px-8 py-3 text-sm tracking-wider"
            style={{
              backgroundColor: "var(--color-deep-charcoal)",
              color: "var(--color-warm-ivory)",
              borderRadius: "4px",
            }}
          >
            ログインページへ
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundColor: "var(--color-warm-ivory)",
        padding: "24px",
      }}
    >
      <div className="w-full max-w-sm">
        <h1
          className="text-3xl font-semibold text-center mb-2 tracking-wide"
          style={{
            fontFamily: "'Noto Serif JP', serif",
            color: "var(--color-deep-charcoal)",
          }}
        >
          NACRÉE
        </h1>
        <p
          className="text-center mb-10 text-sm"
          style={{ color: "var(--color-muted)" }}
        >
          新規アカウント登録
        </p>

        {!configured && (
          <div
            className="mb-6 p-4 text-sm"
            style={{
              backgroundColor: "rgba(184, 149, 106, 0.1)",
              border: "1px solid var(--color-antique-gold)",
              borderRadius: "4px",
              color: "var(--color-deep-charcoal)",
            }}
          >
            Supabase未接続: .env.local にSUPABASE_URLとANON_KEYを設定してください。
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-5">
          <div>
            <label
              className="block text-xs mb-2 tracking-wide"
              style={{ color: "var(--color-muted)" }}
            >
              お名前
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3 text-sm outline-none transition-colors"
              style={{
                backgroundColor: "transparent",
                border: "1px solid var(--color-border)",
                borderRadius: "4px",
                color: "var(--color-deep-charcoal)",
              }}
              placeholder="山田 花子"
            />
          </div>

          <div>
            <label
              className="block text-xs mb-2 tracking-wide"
              style={{ color: "var(--color-muted)" }}
            >
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 text-sm outline-none transition-colors"
              style={{
                backgroundColor: "transparent",
                border: "1px solid var(--color-border)",
                borderRadius: "4px",
                color: "var(--color-deep-charcoal)",
              }}
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label
              className="block text-xs mb-2 tracking-wide"
              style={{ color: "var(--color-muted)" }}
            >
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 text-sm outline-none transition-colors"
              style={{
                backgroundColor: "transparent",
                border: "1px solid var(--color-border)",
                borderRadius: "4px",
                color: "var(--color-deep-charcoal)",
              }}
              placeholder="6文字以上"
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: "#c44" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm tracking-wider transition-opacity disabled:opacity-50"
            style={{
              backgroundColor: "var(--color-deep-charcoal)",
              color: "var(--color-warm-ivory)",
              borderRadius: "4px",
            }}
          >
            {loading ? "登録中..." : "アカウント登録"}
          </button>
        </form>

        <p
          className="text-center mt-8 text-sm"
          style={{ color: "var(--color-muted)" }}
        >
          既にアカウントをお持ちの方は{" "}
          <Link
            href="/auth/login"
            className="underline"
            style={{ color: "var(--color-antique-gold)" }}
          >
            ログイン
          </Link>
        </p>
      </div>
    </main>
  );
}
