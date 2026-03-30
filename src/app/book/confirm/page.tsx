"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BookingSteps } from "@/components/booking-steps";

interface BookingData {
  menu: { id: string; name: string; price: number; duration_min: number };
  staff: { id: string; name: string };
  datetime: { date: string; time: string };
}

type PaymentMethod = "prepaid" | "onsite";

export default function BookConfirmPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><p className="text-sm" style={{ color: "rgba(26,26,26,0.5)" }}>読み込み中...</p></div>}>
      <BookConfirmContent />
    </Suspense>
  );
}

function BookConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<BookingData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("onsite");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const menuStr = sessionStorage.getItem("booking_menu");
    const staffStr = sessionStorage.getItem("booking_staff");
    const dtStr = sessionStorage.getItem("booking_datetime");
    if (!menuStr || !staffStr || !dtStr) {
      router.replace("/book");
      return;
    }
    setData({
      menu: JSON.parse(menuStr),
      staff: JSON.parse(staffStr),
      datetime: JSON.parse(dtStr),
    });

    // 決済キャンセルで戻ってきた場合
    if (searchParams.get("payment") === "cancelled") {
      setError("決済がキャンセルされました。再度お試しください。");
    }
  }, [router, searchParams]);

  async function handleSubmit() {
    if (!data) return;
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login?redirect=/book/confirm");
        return;
      }

      // 予約番号の生成
      const bookingNumber = `NR-${Date.now().toString(36).toUpperCase()}`;

      // end_time の計算
      const [hours, minutes] = data.datetime.time.split(":").map(Number);
      const totalMin = hours * 60 + minutes + data.menu.duration_min;
      const endTime = `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}:00`;

      // 予約をDBに挿入
      const { data: insertedBooking, error: insertError } = await supabase
        .from("bookings")
        .insert({
          customer_id: user.id,
          staff_id: data.staff.id === "any" ? null : data.staff.id,
          menu_id: data.menu.id,
          date: data.datetime.date,
          start_time: data.datetime.time + ":00",
          end_time: endTime,
          status: "confirmed",
          notes: `予約番号: ${bookingNumber}`,
        })
        .select("id")
        .single();

      if (insertError) {
        // staff_id が UUID でない場合（ダミーデータ）はnullにして再試行
        if (insertError.message.includes("uuid")) {
          const { data: retryData, error: retryError } = await supabase
            .from("bookings")
            .insert({
              customer_id: user.id,
              staff_id: null,
              menu_id: data.menu.id,
              date: data.datetime.date,
              start_time: data.datetime.time + ":00",
              end_time: endTime,
              status: "confirmed",
              notes: `予約番号: ${bookingNumber} / 担当: ${data.staff.name}`,
            })
            .select("id")
            .single();
          if (retryError) {
            // menu_id もダミーの場合
            const { data: lastData, error: lastError } = await supabase
              .from("bookings")
              .insert({
                customer_id: user.id,
                staff_id: null,
                menu_id: null,
                date: data.datetime.date,
                start_time: data.datetime.time + ":00",
                end_time: endTime,
                status: "confirmed",
                notes: `予約番号: ${bookingNumber} / ${data.menu.name} / 担当: ${data.staff.name}`,
              })
              .select("id")
              .single();
            if (lastError) throw lastError;
            await handlePostBooking(lastData?.id, bookingNumber, user.email || "");
            return;
          }
          await handlePostBooking(retryData?.id, bookingNumber, user.email || "");
          return;
        } else {
          throw insertError;
        }
      }

      await handlePostBooking(insertedBooking?.id, bookingNumber, user.email || "");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "予約に失敗しました";
      setError(message);
      setSubmitting(false);
    }
  }

  async function handlePostBooking(
    bookingId: string | undefined,
    bookingNumber: string,
    customerEmail: string
  ) {
    if (!data) return;

    // 事前決済の場合 — Cloudflare Pages Function経由でStripe Checkout
    if (paymentMethod === "prepaid") {
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: bookingId || bookingNumber,
            menuName: data.menu.name,
            price: data.menu.price,
            customerEmail,
          }),
        });
        const result = await res.json();

        if (result.url) {
          // Stripe Checkoutページへリダイレクト
          window.location.href = result.url;
          return;
        }

        if (result.mock) {
          // Stripe未設定時のフォールバック
          console.log("[Mock Payment] Stripe未設定のためモック決済");
          await sendNotification(bookingId, bookingNumber, customerEmail);
          sessionStorage.removeItem("booking_menu");
          sessionStorage.removeItem("booking_staff");
          sessionStorage.removeItem("booking_datetime");
          router.push(`/book/complete?bn=${encodeURIComponent(bookingNumber)}&payment=mock`);
          return;
        }

        if (result.error) {
          setError(result.error);
          setSubmitting(false);
          return;
        }
      } catch {
        console.warn("決済API接続エラー。当日払いにフォールバックします。");
      }
    }

    // 当日払い
    // booking_paymentsに当日払いとして記録
    try {
      const supabase = createClient();
      if (bookingId) {
        await supabase.from("booking_payments").upsert({
          booking_id: bookingId,
          amount: data.menu.price,
          currency: "jpy",
          status: "pending",
        }, { onConflict: "booking_id" });
      }
    } catch {
      // booking_payments更新失敗は致命的でないので続行
    }

    await sendNotification(bookingId, bookingNumber, customerEmail);
    sessionStorage.removeItem("booking_menu");
    sessionStorage.removeItem("booking_staff");
    sessionStorage.removeItem("booking_datetime");
    router.push(`/book/complete?bn=${encodeURIComponent(bookingNumber)}`);
  }

  async function sendNotification(
    bookingId: string | undefined,
    bookingNumber: string,
    customerEmail: string
  ) {
    if (!data) return;
    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "confirmation",
          customerEmail,
          customerName: "お客様",
          menuName: data.menu.name,
          staffName: data.staff.name,
          date: data.datetime.date,
          time: data.datetime.time,
          amount: data.menu.price,
          bookingNumber,
        }),
      });
    } catch {
      console.log("[Email] 通知送信に失敗しましたが、予約は完了しています");
    }
  }

  if (!data) return null;

  return (
    <>
      <BookingSteps current={4} />
      <h1
        className="text-xl md:text-2xl font-medium tracking-[0.1em] text-center mb-10"
        style={{ fontFamily: "'Noto Serif JP', serif" }}
      >
        ご予約内容の確認
      </h1>

      <div
        className="max-w-[500px] mx-auto bg-white border border-[var(--color-border)] p-6 md:p-10"
        style={{ borderRadius: "8px" }}
      >
        <div className="space-y-6">
          <div className="flex justify-between items-start border-b border-[var(--color-border)] pb-4">
            <span className="text-xs text-[var(--color-muted)] tracking-wider">
              施術メニュー
            </span>
            <div className="text-right">
              <p className="text-sm font-medium">{data.menu.name}</p>
              <p
                className="text-xs text-[var(--color-muted)] mt-1"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {data.menu.duration_min}min / &yen;{data.menu.price.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex justify-between items-start border-b border-[var(--color-border)] pb-4">
            <span className="text-xs text-[var(--color-muted)] tracking-wider">
              担当スタッフ
            </span>
            <p className="text-sm font-medium">{data.staff.name}</p>
          </div>
          <div className="flex justify-between items-start border-b border-[var(--color-border)] pb-4">
            <span className="text-xs text-[var(--color-muted)] tracking-wider">
              日時
            </span>
            <p
              className="text-sm font-medium"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {data.datetime.date.replace(/-/g, "/")} {data.datetime.time}
            </p>
          </div>
          <div className="flex justify-between items-start border-b border-[var(--color-border)] pb-4">
            <span className="text-xs text-[var(--color-muted)] tracking-wider">
              お支払い金額
            </span>
            <p
              className="text-lg font-medium"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              &yen;{data.menu.price.toLocaleString()}
            </p>
          </div>

          {/* 決済方法選択 */}
          <div>
            <p className="text-xs text-[var(--color-muted)] tracking-wider mb-3">
              お支払い方法
            </p>
            <div className="space-y-2">
              <label
                className="flex items-center gap-3 p-3.5 border cursor-pointer transition-colors"
                style={{
                  borderRadius: "6px",
                  borderColor:
                    paymentMethod === "prepaid"
                      ? "var(--color-antique-gold)"
                      : "var(--color-border)",
                  backgroundColor:
                    paymentMethod === "prepaid"
                      ? "rgba(184,149,106,0.04)"
                      : "transparent",
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  value="prepaid"
                  checked={paymentMethod === "prepaid"}
                  onChange={() => setPaymentMethod("prepaid")}
                  className="sr-only"
                />
                <span
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor:
                      paymentMethod === "prepaid"
                        ? "var(--color-antique-gold)"
                        : "var(--color-border)",
                  }}
                >
                  {paymentMethod === "prepaid" && (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: "var(--color-antique-gold)" }}
                    />
                  )}
                </span>
                <div>
                  <p className="text-sm font-medium">事前オンライン決済</p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">
                    クレジットカードで事前にお支払い
                  </p>
                </div>
                <div className="ml-auto">
                  <svg
                    className="w-5 h-5"
                    style={{ color: "var(--color-muted)" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                    />
                  </svg>
                </div>
              </label>

              <label
                className="flex items-center gap-3 p-3.5 border cursor-pointer transition-colors"
                style={{
                  borderRadius: "6px",
                  borderColor:
                    paymentMethod === "onsite"
                      ? "var(--color-antique-gold)"
                      : "var(--color-border)",
                  backgroundColor:
                    paymentMethod === "onsite"
                      ? "rgba(184,149,106,0.04)"
                      : "transparent",
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  value="onsite"
                  checked={paymentMethod === "onsite"}
                  onChange={() => setPaymentMethod("onsite")}
                  className="sr-only"
                />
                <span
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor:
                      paymentMethod === "onsite"
                        ? "var(--color-antique-gold)"
                        : "var(--color-border)",
                  }}
                >
                  {paymentMethod === "onsite" && (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: "var(--color-antique-gold)" }}
                    />
                  )}
                </span>
                <div>
                  <p className="text-sm font-medium">当日店頭払い</p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">
                    ご来店時にお支払い
                  </p>
                </div>
                <div className="ml-auto">
                  <svg
                    className="w-5 h-5"
                    style={{ color: "var(--color-muted)" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349m-18 0A2.625 2.625 0 015.25 6h13.5A2.625 2.625 0 0121 9.349"
                    />
                  </svg>
                </div>
              </label>
            </div>

            {/* テストモード表示 */}
            <div
              className="mt-3 p-2.5 text-center"
              style={{
                backgroundColor: "rgba(184,149,106,0.06)",
                borderRadius: "4px",
              }}
            >
              <p
                className="text-xs"
                style={{ color: "var(--color-antique-gold)" }}
              >
                <span className="font-medium">TEST MODE</span> &#8212;
                ポートフォリオ用デモ（実際の課金は発生しません）
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div
            className="mt-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs"
            style={{ borderRadius: "4px" }}
          >
            {error}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 text-sm tracking-[0.15em] text-[var(--color-warm-ivory)] bg-[var(--color-antique-gold)] hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ borderRadius: "4px" }}
          >
            {submitting
              ? "処理中..."
              : paymentMethod === "prepaid"
              ? "決済に進む"
              : "予約を確定する"}
          </button>
          <button
            onClick={() => router.back()}
            className="w-full py-3 text-sm tracking-wider text-[var(--color-muted)] hover:text-[var(--color-deep-charcoal)] transition-colors"
          >
            戻る
          </button>
        </div>
      </div>
    </>
  );
}
