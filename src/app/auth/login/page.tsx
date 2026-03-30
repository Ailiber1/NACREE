"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirectTo, setRedirectTo] = useState("/");

  const configured = isSupabaseConfigured();

  useEffect(() => {
    const redirect = searchParams.get("redirect");
    if (redirect) {
      setRedirectTo(redirect);
    } else if (typeof window !== "undefined" && sessionStorage.getItem("booking_menu")) {
      setRedirectTo("/book/confirm");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) {
      setError("Supabaseが設定されていません。.env.local を設定してください。");
      return;
    }
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const errorMessages: Record<string, string> = {
        "Invalid login credentials": "メールアドレスまたはパスワードが正しくありません。",
        "Email not confirmed": "メールアドレスが確認されていません。確認メールをご確認ください。",
        "Invalid email or password": "メールアドレスまたはパスワードが正しくありません。",
        "Email rate limit exceeded": "しばらく時間をおいてから再度お試しください。",
      };
      setError(errorMessages[error.message] || error.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  };

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
          <Link href="/" className="hover:opacity-70 transition-opacity">NACRÉE</Link>
        </h1>
        <p
          className="text-center mb-10 text-sm"
          style={{ color: "var(--color-muted)" }}
        >
          ログイン
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

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
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
              className="w-full px-4 py-3 text-sm outline-none transition-colors"
              style={{
                backgroundColor: "transparent",
                border: "1px solid var(--color-border)",
                borderRadius: "4px",
                color: "var(--color-deep-charcoal)",
              }}
              placeholder="パスワード"
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
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <p
          className="text-center mt-8 text-sm"
          style={{ color: "var(--color-muted)" }}
        >
          アカウントをお持ちでない方は{" "}
          <Link
            href="/auth/signup"
            className="underline"
            style={{ color: "var(--color-antique-gold)" }}
          >
            新規登録
          </Link>
        </p>
      </div>
    </main>
  );
}
