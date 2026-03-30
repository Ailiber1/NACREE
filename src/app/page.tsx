"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Menu } from "@/lib/supabase/types";

const STAFF_DATA = [
  {
    name: "田中 美咲",
    title: "チーフエステティシャン",
    specialty: "フェイシャルケア歴12年",
    image: "/images/staff-1.jpg",
  },
  {
    name: "佐藤 香織",
    title: "アロマセラピスト",
    specialty: "英国IFA認定資格保持",
    image: "/images/staff-2.jpg",
  },
  {
    name: "鈴木 優花",
    title: "エステティシャン",
    specialty: "敏感肌ケアのスペシャリスト",
    image: "/images/staff-3.jpg",
  },
];

const BOOKING_STEPS = [
  { num: "01", label: "メニュー選択" },
  { num: "02", label: "スタッフ選択" },
  { num: "03", label: "日時選択" },
  { num: "04", label: "予約確定" },
];

const FALLBACK_MENUS: Menu[] = [
  {
    id: "9eed4a6c-f659-4067-82a6-27217b00454a",
    name: "フェイシャルトリートメント",
    description:
      "肌の奥深くに潤いを届け、毛穴ほこりや古い角質を丁寧に除去するフェイシャルケア。",
    price: 18000,
    duration_min: 60,
    image_url: "/images/menu-facial.jpg",
    is_active: true,
    sort_order: 1,
    created_at: "",
    updated_at: "",
  },
  {
    id: "08e2d05e-b843-4419-83f3-2c36e1c1ae5f",
    name: "アロマボディケア",
    description:
      "お客様の体調に合わせた精油をブレンド。心身の疲れをほぐす至上のボディトリートメント。",
    price: 24000,
    duration_min: 90,
    image_url: "/images/menu-body.jpg",
    is_active: true,
    sort_order: 2,
    created_at: "",
    updated_at: "",
  },
  {
    id: "0c604222-de6a-460e-abc4-627f5590541d",
    name: "プレミアムコース",
    description:
      "フェイシャルからボディまで、厳選された施術を組み合わせたトータルビューティーコース。",
    price: 38000,
    duration_min: 120,
    image_url: "/images/menu-premium.jpg",
    is_active: true,
    sort_order: 3,
    created_at: "",
    updated_at: "",
  },
];

export default function Home() {
  const [menus, setMenus] = useState<Menu[]>(FALLBACK_MENUS);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function init() {
      if (!isSupabaseConfigured()) return;
      const supabase = createClient();

      // メニュー取得
      try {
        const { data, error } = await supabase
          .from("menus")
          .select("*")
          .eq("is_active", true)
          .order("sort_order");
        if (!error && data && data.length > 0) {
          setMenus(data.slice(0, 3));
        }
      } catch {}

      // 認証状態チェック
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsLoggedIn(true);
          setUserName(user.user_metadata?.full_name || user.email?.split("@")[0] || "");
        }
      } catch {}
    }
    init();
  }, []);

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-warm-ivory)]/95 backdrop-blur-sm border-b border-[var(--color-border)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-between h-16 md:h-20">
          <Link
            href="/"
            className="text-xl md:text-2xl font-semibold tracking-[0.15em]"
            style={{ fontFamily: "'Noto Serif JP', serif" }}
          >
            NACRÉE
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm tracking-wide text-[var(--color-muted)]">
            <a href="#concept" className="hover:text-[var(--color-deep-charcoal)] transition-colors">
              コンセプト
            </a>
            <a href="#menu" className="hover:text-[var(--color-deep-charcoal)] transition-colors">
              メニュー
            </a>
            <a href="#staff" className="hover:text-[var(--color-deep-charcoal)] transition-colors">
              スタッフ
            </a>
            <a href="#booking" className="hover:text-[var(--color-deep-charcoal)] transition-colors">
              ご予約
            </a>
          </nav>
          <div className="flex items-center gap-3 sm:gap-4">
            {isLoggedIn ? (
              <>
                <Link
                  href="/mypage"
                  className="text-xs tracking-wider text-[var(--color-muted)] hover:text-[var(--color-deep-charcoal)] transition-colors"
                >
                  <span className="hidden sm:inline">{userName} 様</span>
                  <span className="sm:hidden">マイページ</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="hidden sm:inline text-xs tracking-wider text-[var(--color-muted)] hover:text-[var(--color-deep-charcoal)] transition-colors"
                >
                  ログイン
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-xs tracking-wider text-[var(--color-muted)] hover:text-[var(--color-deep-charcoal)] transition-colors"
                >
                  <span className="hidden sm:inline">新規登録</span>
                  <span className="sm:hidden">登録/ログイン</span>
                </Link>
              </>
            )}
            <Link
              href="/book"
              className="text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-2.5 tracking-wider text-[var(--color-warm-ivory)] bg-[var(--color-antique-gold)] hover:opacity-90 transition-opacity"
              style={{ borderRadius: "4px" }}
            >
              ご予約はこちら
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative w-full h-screen min-h-[600px] flex items-center justify-center">
          <Image
            src="/images/hero-bg.jpg"
            alt="NACRÉE サロン"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 text-center px-4">
            <h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-white leading-relaxed mb-4"
              style={{ fontFamily: "'Noto Serif JP', serif", letterSpacing: "0.08em" }}
            >
              真珠のような輝きを、<br className="sm:hidden" />あなたの肌に。
            </h1>
            <p className="text-white/70 text-sm md:text-base tracking-wider mb-10">
              完全予約制プライベートサロン
            </p>
            <Link
              href="/book"
              className="inline-block px-8 py-3.5 text-sm tracking-[0.15em] text-[var(--color-deep-charcoal)] bg-[var(--color-warm-ivory)] hover:bg-white transition-colors"
              style={{ borderRadius: "4px" }}
            >
              空き状況を確認する
            </Link>
          </div>
        </section>

        {/* Concept */}
        <section id="concept" className="py-20 md:py-28 lg:py-32 bg-[var(--color-warm-ivory)]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <h2
              className="text-center text-2xl md:text-3xl font-medium tracking-[0.1em] mb-16 md:mb-20"
              style={{ fontFamily: "'Noto Serif JP', serif" }}
            >
              コンセプト
            </h2>
            <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 lg:gap-20">
              <div className="w-full md:w-1/2 relative aspect-[4/5] overflow-hidden" style={{ borderRadius: "4px" }}>
                <Image
                  src="/images/concept.jpg"
                  alt="NACRÉEのコンセプト"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="w-full md:w-1/2">
                <p
                  className="text-base md:text-lg leading-[2.2] text-[var(--color-deep-charcoal)]"
                  style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                >
                  NACRÉEでは、お客様一人ひとりの本来の美しさを最大限に引き出すことを信じています。
                </p>
                <p
                  className="mt-6 text-base md:text-lg leading-[2.2] text-[var(--color-muted)]"
                  style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                >
                  厳選された高品質素材と独自のハンドテクニックを用いたオーダーメイドのトリートメントで、あなただけのプライベート空間を。心身ともに深いリラクゼーションをご堪能ください。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Menu */}
        <section id="menu" className="py-20 md:py-28 lg:py-32 bg-white">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <h2
              className="text-center text-2xl md:text-3xl font-medium tracking-[0.1em] mb-16 md:mb-20"
              style={{ fontFamily: "'Noto Serif JP', serif" }}
            >
              施術メニュー
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {menus.map((menu) => (
                <div key={menu.id} className="flex flex-col">
                  <div className="relative aspect-[4/3] overflow-hidden mb-5" style={{ borderRadius: "4px" }}>
                    <Image
                      src={menu.image_url || "/images/menu-facial.jpg"}
                      alt={menu.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h3
                    className="text-lg font-medium mb-2 tracking-wide"
                    style={{ fontFamily: "'Noto Serif JP', serif" }}
                  >
                    {menu.name}
                  </h3>
                  <p className="text-sm text-[var(--color-muted)] mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {menu.duration_min}min ¥{menu.price.toLocaleString()}
                  </p>
                  <p className="text-sm leading-relaxed text-[var(--color-muted)] mb-4 flex-1">
                    {menu.description}
                  </p>
                  <Link
                    href="/book"
                    className="text-sm text-[var(--color-antique-gold)] hover:opacity-70 transition-opacity tracking-wider"
                  >
                    予約する →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Staff */}
        <section id="staff" className="relative py-20 md:py-28 lg:py-32">
          <Image
            src="/images/staff-bg.jpg"
            alt=""
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[var(--color-deep-charcoal)]/85" />
          <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6">
            <h2
              className="text-center text-2xl md:text-3xl font-medium tracking-[0.1em] mb-16 md:mb-20 text-white"
              style={{ fontFamily: "'Noto Serif JP', serif" }}
            >
              スタッフ紹介
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-10 md:gap-16">
              {STAFF_DATA.map((staff) => (
                <div key={staff.name} className="text-center">
                  <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden mx-auto mb-5 border-2 border-[var(--color-antique-gold)]/40 relative">
                    <Image
                      src={staff.image}
                      alt={staff.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-white font-medium tracking-wide mb-1">{staff.name}</p>
                  <p className="text-white/60 text-xs tracking-wider mb-1">{staff.title}</p>
                  <p className="text-white/40 text-xs">{staff.specialty}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Booking Preview */}
        <section id="booking" className="relative py-20 md:py-28 lg:py-32">
          <Image
            src="/images/booking-bg.jpg"
            alt=""
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[var(--color-warm-ivory)]/90" />
          <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row gap-12 md:gap-20">
              <div className="w-full md:w-1/2">
                <h2
                  className="text-2xl md:text-3xl font-medium tracking-[0.1em] mb-6"
                  style={{ fontFamily: "'Noto Serif JP', serif" }}
                >
                  ご予約
                </h2>
                <p className="text-sm text-[var(--color-muted)] mb-3">
                  メニュー選択 → スタッフ選択 → 日時選択
                </p>
                <div className="flex items-center gap-4 mb-10">
                  {BOOKING_STEPS.map((step, i) => (
                    <div key={step.num} className="flex items-center gap-4">
                      <div className="text-center">
                        <span
                          className="block text-xs text-[var(--color-antique-gold)] mb-1"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          {step.num}
                        </span>
                        <span className="text-xs text-[var(--color-muted)]">{step.label}</span>
                      </div>
                      {i < BOOKING_STEPS.length - 1 && (
                        <div className="w-6 h-px bg-[var(--color-border)]" />
                      )}
                    </div>
                  ))}
                </div>
                <Link
                  href="/book"
                  className="inline-block px-8 py-3.5 text-sm tracking-[0.15em] text-[var(--color-warm-ivory)] bg-[var(--color-deep-charcoal)] hover:opacity-90 transition-opacity"
                  style={{ borderRadius: "4px" }}
                >
                  予約を開始する
                </Link>
              </div>
              <div className="w-full md:w-1/2">
                <CalendarPreview />
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-20 md:py-28">
          <Image
            src="/images/cta-bg.jpg"
            alt=""
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 text-center px-4">
            <h2
              className="text-2xl md:text-3xl font-medium text-white tracking-[0.1em] mb-8"
              style={{ fontFamily: "'Noto Serif JP', serif" }}
            >
              あなただけの特別な時間を
            </h2>
            <Link
              href="/book"
              className="inline-block px-10 py-4 text-sm tracking-[0.15em] text-[var(--color-deep-charcoal)] bg-[var(--color-antique-gold)] hover:opacity-90 transition-opacity"
              style={{ borderRadius: "4px" }}
            >
              今すぐご予約
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[var(--color-deep-charcoal)] py-16 md:py-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 text-center">
          <p
            className="text-white text-xl tracking-[0.2em] mb-6"
            style={{ fontFamily: "'Noto Serif JP', serif" }}
          >
            NACRÉE
          </p>
          <p className="text-white/50 text-xs leading-relaxed mb-2">
            〒107-0062 東京都港区南青山3-1-1 NACRÉEビル 3F
          </p>
          <p className="text-white/50 text-xs mb-8">
            営業時間：10:00 - 20:00 ／ 定休日：月曜日
          </p>
          <p className="text-white/30 text-xs">
            Copyright &copy; NACRÉE All Rights Reserved.
          </p>
        </div>
      </footer>
    </>
  );
}

function CalendarPreview() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();
  const monthNames = [
    "1月", "2月", "3月", "4月", "5月", "6月",
    "7月", "8月", "9月", "10月", "11月", "12月",
  ];
  const dayLabels = ["日", "月", "火", "水", "木", "金", "土"];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-white p-6 md:p-8 shadow-sm" style={{ borderRadius: "8px" }}>
      <p
        className="text-center text-sm font-medium mb-4 tracking-wider"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {year}年 {monthNames[month]}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
        {dayLabels.map((d) => (
          <span key={d} className="text-[var(--color-muted)] pb-2">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {cells.map((day, i) => {
          if (day === null) return <span key={`e-${i}`} />;
          const isPast = day < today.getDate();
          const isToday = day === today.getDate();
          return (
            <span
              key={day}
              className={`py-1.5 ${
                isPast
                  ? "text-[var(--color-border)]"
                  : isToday
                  ? "bg-[var(--color-antique-gold)] text-white font-medium"
                  : "text-[var(--color-deep-charcoal)]"
              }`}
              style={{ borderRadius: "4px", fontFamily: "'Inter', sans-serif" }}
            >
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
}
