import Link from "next/link";

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-warm-ivory)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-warm-ivory)]">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link
            href="/"
            className="text-lg font-semibold tracking-[0.15em]"
            style={{ fontFamily: "'Noto Serif JP', serif" }}
          >
            NACRÉE
          </Link>
          <Link
            href="/"
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-deep-charcoal)] transition-colors tracking-wider"
          >
            トップに戻る
          </Link>
        </div>
      </header>
      <main className="max-w-[800px] mx-auto px-4 sm:px-6 py-10 md:py-16">
        {children}
      </main>
    </div>
  );
}
