"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BookingSteps } from "@/components/booking-steps";

interface BookingData {
  menu: { id: string; name: string; price: number; duration_min: number };
  staff: { id: string; name: string };
  datetime: { date: string; time: string };
}

export default function BookConfirmPage() {
  const router = useRouter();
  const [data, setData] = useState<BookingData | null>(null);
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
  }, [router]);

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
        // ログインしていない場合はログインへリダイレクト
        sessionStorage.setItem("booking_redirect", "/book/confirm");
        router.push("/auth/login");
        return;
      }

      // 予約番号の生成
      const bookingNumber = `NR-${Date.now().toString(36).toUpperCase()}`;

      // end_time の計算
      const [hours, minutes] = data.datetime.time.split(":").map(Number);
      const totalMin = hours * 60 + minutes + data.menu.duration_min;
      const endTime = `${String(Math.floor(totalMin / 60)).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}:00`;

      const { error: insertError } = await supabase.from("bookings").insert({
        customer_id: user.id,
        staff_id: data.staff.id === "any" ? null : data.staff.id,
        menu_id: data.menu.id,
        date: data.datetime.date,
        start_time: data.datetime.time + ":00",
        end_time: endTime,
        status: "confirmed",
        notes: `予約番号: ${bookingNumber}`,
      });

      if (insertError) {
        // staff_id が UUID でない場合（ダミーデータ）はnullにして再試行
        if (insertError.message.includes("uuid")) {
          const { error: retryError } = await supabase.from("bookings").insert({
            customer_id: user.id,
            staff_id: null,
            menu_id: data.menu.id,
            date: data.datetime.date,
            start_time: data.datetime.time + ":00",
            end_time: endTime,
            status: "confirmed",
            notes: `予約番号: ${bookingNumber} / 担当: ${data.staff.name}`,
          });
          if (retryError) {
            // menu_id もダミーの場合、全てnullにして再試行
            const { error: lastError } = await supabase.from("bookings").insert({
              customer_id: user.id,
              staff_id: null,
              menu_id: null,
              date: data.datetime.date,
              start_time: data.datetime.time + ":00",
              end_time: endTime,
              status: "confirmed",
              notes: `予約番号: ${bookingNumber} / ${data.menu.name} / 担当: ${data.staff.name}`,
            });
            if (lastError) throw lastError;
          }
        } else {
          throw insertError;
        }
      }

      // 完了ページへ
      sessionStorage.setItem("booking_number", bookingNumber);
      sessionStorage.removeItem("booking_menu");
      sessionStorage.removeItem("booking_staff");
      sessionStorage.removeItem("booking_datetime");
      router.push("/book/complete");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "予約に失敗しました";
      setError(message);
    } finally {
      setSubmitting(false);
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

      <div className="max-w-[500px] mx-auto bg-white border border-[var(--color-border)] p-6 md:p-10" style={{ borderRadius: "8px" }}>
        <div className="space-y-6">
          <div className="flex justify-between items-start border-b border-[var(--color-border)] pb-4">
            <span className="text-xs text-[var(--color-muted)] tracking-wider">施術メニュー</span>
            <div className="text-right">
              <p className="text-sm font-medium">{data.menu.name}</p>
              <p className="text-xs text-[var(--color-muted)] mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                {data.menu.duration_min}min / ¥{data.menu.price.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex justify-between items-start border-b border-[var(--color-border)] pb-4">
            <span className="text-xs text-[var(--color-muted)] tracking-wider">担当スタッフ</span>
            <p className="text-sm font-medium">{data.staff.name}</p>
          </div>
          <div className="flex justify-between items-start border-b border-[var(--color-border)] pb-4">
            <span className="text-xs text-[var(--color-muted)] tracking-wider">日時</span>
            <p className="text-sm font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
              {data.datetime.date.replace(/-/g, "/")} {data.datetime.time}
            </p>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-xs text-[var(--color-muted)] tracking-wider">お支払い</span>
            <p className="text-lg font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
              ¥{data.menu.price.toLocaleString()}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs" style={{ borderRadius: "4px" }}>
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
            {submitting ? "予約中..." : "予約を確定する"}
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
