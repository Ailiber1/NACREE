import Link from "next/link";

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: "var(--color-warm-ivory)" }}
    >
      <div className="text-center" style={{ padding: "80px 24px" }}>
        <h1
          className="text-4xl md:text-5xl font-semibold tracking-wide mb-6"
          style={{
            fontFamily: "'Noto Serif JP', serif",
            color: "var(--color-deep-charcoal)",
          }}
        >
          NACRÉE
        </h1>
        <p
          className="text-lg mb-12"
          style={{
            color: "var(--color-muted)",
            fontFamily: "'Noto Sans JP', sans-serif",
          }}
        >
          上質なひとときを、あなたに。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/login"
            className="inline-block px-8 py-3 text-sm tracking-wider transition-colors"
            style={{
              backgroundColor: "var(--color-deep-charcoal)",
              color: "var(--color-warm-ivory)",
              borderRadius: "4px",
            }}
          >
            ログイン
          </Link>
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-3 text-sm tracking-wider transition-colors"
            style={{
              border: "1px solid var(--color-deep-charcoal)",
              color: "var(--color-deep-charcoal)",
              borderRadius: "4px",
            }}
          >
            新規登録
          </Link>
        </div>
      </div>
    </main>
  );
}
