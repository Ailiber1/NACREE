"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Booking, Menu } from "@/lib/supabase/types";

interface BookingWithMenu extends Booking {
  menus?: Menu | null;
}

export default function MyPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingWithMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    // Get profile name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    setUserName(profile?.full_name || user.email?.split("@")[0] || "ゲスト");

    // Get bookings with menu info
    const { data, error } = await supabase
      .from("bookings")
      .select("*, menus(*)")
      .eq("customer_id", user.id)
      .order("date", { ascending: false });

    if (!error && data) {
      setBookings(data);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  async function handleCancel(bookingId: string) {
    if (!confirm("この予約をキャンセルしますか？")) return;
    setCancelling(bookingId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);
      if (error) throw error;
      await fetchBookings();
    } catch (err) {
      console.error("キャンセルエラー:", err);
      alert("キャンセルに失敗しました");
    } finally {
      setCancelling(null);
    }
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const upcomingBookings = bookings.filter(
    (b) => b.date >= todayStr && b.status === "confirmed"
  );
  const pastBookings = bookings.filter(
    (b) => b.date < todayStr || b.status !== "confirmed"
  );

  function statusLabel(status: string) {
    switch (status) {
      case "confirmed": return "予約確定";
      case "visited": return "来店済み";
      case "cancelled": return "キャンセル";
      case "no_show": return "無断キャンセル";
      default: return status;
    }
  }

  function statusColor(status: string) {
    switch (status) {
      case "confirmed": return "bg-[var(--color-sage-green)]/10 text-[var(--color-sage-green)]";
      case "cancelled": return "bg-red-50 text-red-500";
      case "visited": return "bg-[var(--color-antique-gold)]/10 text-[var(--color-antique-gold)]";
      default: return "bg-gray-100 text-gray-500";
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-warm-ivory)]">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-warm-ivory)]">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link
            href="/"
            className="text-lg font-semibold tracking-[0.15em]"
            style={{ fontFamily: "'Noto Serif JP', serif" }}
          >
            NACRÉE
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/book"
              className="text-xs text-[var(--color-antique-gold)] hover:opacity-70 transition-opacity tracking-wider"
            >
              新規予約
            </Link>
            <Link
              href="/"
              className="text-xs text-[var(--color-muted)] hover:text-[var(--color-deep-charcoal)] transition-colors tracking-wider"
            >
              トップ
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto px-4 sm:px-6 py-10 md:py-16">
        <h1
          className="text-xl md:text-2xl font-medium tracking-[0.1em] mb-2"
          style={{ fontFamily: "'Noto Serif JP', serif" }}
        >
          マイページ
        </h1>
        <p className="text-sm text-[var(--color-muted)] mb-10">
          {userName} 様
        </p>

        {loading ? (
          <div className="text-center py-20 text-[var(--color-muted)] text-sm">読み込み中...</div>
        ) : (
          <>
            {/* Upcoming */}
            <section className="mb-12">
              <h2 className="text-sm font-medium tracking-wider text-[var(--color-antique-gold)] mb-4 uppercase">
                次回のご予約
              </h2>
              {upcomingBookings.length === 0 ? (
                <div
                  className="bg-white border border-[var(--color-border)] p-8 text-center"
                  style={{ borderRadius: "8px" }}
                >
                  <p className="text-sm text-[var(--color-muted)] mb-4">
                    現在のご予約はありません
                  </p>
                  <Link
                    href="/book"
                    className="inline-block px-6 py-2.5 text-sm tracking-wider text-[var(--color-warm-ivory)] bg-[var(--color-antique-gold)] hover:opacity-90 transition-opacity"
                    style={{ borderRadius: "4px" }}
                  >
                    予約する
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((b) => (
                    <div
                      key={b.id}
                      className="bg-white border border-[var(--color-border)] p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4"
                      style={{ borderRadius: "8px" }}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                          {b.menus?.name || extractFromNotes(b.notes, "menu")}
                        </p>
                        <p className="text-xs text-[var(--color-muted)]" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {b.date.replace(/-/g, "/")} {b.start_time.slice(0, 5)}
                        </p>
                        {b.notes && b.notes.includes("予約番号") && (
                          <p className="text-xs text-[var(--color-muted)] mt-1">
                            {b.notes.split("/")[0]?.trim()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs px-3 py-1 tracking-wider ${statusColor(b.status)}`}
                          style={{ borderRadius: "4px" }}
                        >
                          {statusLabel(b.status)}
                        </span>
                        <button
                          onClick={() => handleCancel(b.id)}
                          disabled={cancelling === b.id}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          {cancelling === b.id ? "処理中..." : "キャンセル"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Past */}
            <section>
              <h2 className="text-sm font-medium tracking-wider text-[var(--color-muted)] mb-4 uppercase">
                予約履歴
              </h2>
              {pastBookings.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">履歴はありません</p>
              ) : (
                <div className="space-y-2">
                  {pastBookings.map((b) => (
                    <div
                      key={b.id}
                      className="bg-white/60 border border-[var(--color-border)] p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-3"
                      style={{ borderRadius: "8px" }}
                    >
                      <div className="flex-1">
                        <p className="text-sm text-[var(--color-muted)]">
                          {b.menus?.name || extractFromNotes(b.notes, "menu")}
                        </p>
                        <p className="text-xs text-[var(--color-border)]" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {b.date.replace(/-/g, "/")} {b.start_time.slice(0, 5)}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-3 py-1 tracking-wider ${statusColor(b.status)}`}
                        style={{ borderRadius: "4px" }}
                      >
                        {statusLabel(b.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function extractFromNotes(notes: string | null, type: "menu" | "staff"): string {
  if (!notes) return "施術メニュー";
  if (type === "menu") {
    const parts = notes.split("/");
    if (parts.length > 1) return parts[1]?.trim() || "施術メニュー";
  }
  return "施術メニュー";
}
