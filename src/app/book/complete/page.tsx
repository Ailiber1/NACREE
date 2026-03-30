"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function BookCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookingNumber, setBookingNumber] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const bn = searchParams.get("bn");
    if (!bn) {
      router.replace("/book");
      return;
    }
    setBookingNumber(bn);
    requestAnimationFrame(() => setShow(true));
  }, [searchParams, router]);

  if (!bookingNumber) return null;

  return (
    <div
      className="text-center py-10 md:py-20 transition-opacity duration-500"
      style={{ opacity: show ? 1 : 0 }}
    >
      <div
        className="w-16 h-16 mx-auto mb-8 flex items-center justify-center bg-[var(--color-sage-green)]/10"
        style={{ borderRadius: "50%" }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-sage-green)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h1
        className="text-xl md:text-2xl font-medium tracking-[0.1em] mb-4"
        style={{ fontFamily: "'Noto Serif JP', serif" }}
      >
        ご予約が完了しました
      </h1>
      <p className="text-sm text-[var(--color-muted)] mb-8">
        ご来店を心よりお待ちしております
      </p>

      <div
        className="inline-block bg-white border border-[var(--color-border)] px-8 py-6 mb-10"
        style={{ borderRadius: "8px" }}
      >
        <p className="text-xs text-[var(--color-muted)] tracking-wider mb-2">予約番号</p>
        <p
          className="text-xl md:text-2xl font-medium tracking-[0.15em]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {bookingNumber}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/mypage"
          className="inline-block px-8 py-3 text-sm tracking-[0.15em] text-[var(--color-warm-ivory)] bg-[var(--color-deep-charcoal)] hover:opacity-90 transition-opacity"
          style={{ borderRadius: "4px" }}
        >
          マイページで確認
        </Link>
        <Link
          href="/"
          className="inline-block px-8 py-3 text-sm tracking-wider text-[var(--color-muted)] border border-[var(--color-border)] hover:border-[var(--color-deep-charcoal)] hover:text-[var(--color-deep-charcoal)] transition-colors"
          style={{ borderRadius: "4px" }}
        >
          トップに戻る
        </Link>
      </div>
    </div>
  );
}

export default function BookCompletePage() {
  return (
    <Suspense fallback={null}>
      <BookCompleteContent />
    </Suspense>
  );
}
