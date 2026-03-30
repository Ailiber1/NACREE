"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BookingSteps } from "@/components/booking-steps";

const TIME_SLOTS = [
  "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30",
];

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default function BookCalendarPage() {
  const router = useRouter();
  const [menuInfo, setMenuInfo] = useState<{ name: string; duration_min: number } | null>(null);
  const [staffInfo, setStaffInfo] = useState<{ name: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  useEffect(() => {
    const menuStr = sessionStorage.getItem("booking_menu");
    const staffStr = sessionStorage.getItem("booking_staff");
    if (!menuStr || !staffStr) {
      router.replace("/book");
      return;
    }
    setMenuInfo(JSON.parse(menuStr));
    setStaffInfo(JSON.parse(staffStr));
  }, [router]);

  const calendarDays = useMemo(() => {
    const { year, month } = viewMonth;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow = new Date(year, month, 1).getDay();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [viewMonth]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  function dateStr(day: number) {
    return `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function isDatePast(day: number) {
    return dateStr(day) < todayStr;
  }

  function isMonday(day: number) {
    return new Date(viewMonth.year, viewMonth.month, day).getDay() === 1;
  }

  function prevMonth() {
    setViewMonth((v) => {
      if (v.month === 0) return { year: v.year - 1, month: 11 };
      return { year: v.year, month: v.month - 1 };
    });
    setSelectedDate(null);
    setSelectedTime(null);
  }

  function nextMonth() {
    setViewMonth((v) => {
      if (v.month === 11) return { year: v.year + 1, month: 0 };
      return { year: v.year, month: v.month + 1 };
    });
    setSelectedDate(null);
    setSelectedTime(null);
  }

  // Simulate available slots — exclude some randomly based on date hash
  function getAvailableSlots(date: string): string[] {
    const hash = date.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return TIME_SLOTS.filter((_, i) => (hash + i * 7) % 5 !== 0);
  }

  function handleConfirm() {
    if (!selectedDate || !selectedTime) return;
    sessionStorage.setItem(
      "booking_datetime",
      JSON.stringify({ date: selectedDate, time: selectedTime })
    );
    router.push("/book/confirm");
  }

  if (!menuInfo || !staffInfo) return null;

  const availableSlots = selectedDate ? getAvailableSlots(selectedDate) : [];
  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

  return (
    <>
      <BookingSteps current={3} />
      <h1
        className="text-xl md:text-2xl font-medium tracking-[0.1em] text-center mb-3"
        style={{ fontFamily: "'Noto Serif JP', serif" }}
      >
        日時を選択
      </h1>
      <p className="text-center text-sm text-[var(--color-muted)] mb-10">
        {menuInfo.name} ・ {staffInfo.name}
      </p>

      <div className="flex flex-col md:flex-row gap-6 md:gap-10">
        {/* Calendar */}
        <div className="flex-1 bg-white p-5 md:p-8 border border-[var(--color-border)]" style={{ borderRadius: "8px" }}>
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="text-[var(--color-muted)] hover:text-[var(--color-deep-charcoal)] transition-colors text-sm px-2"
            >
              ← 前月
            </button>
            <span className="text-sm font-medium tracking-wider" style={{ fontFamily: "'Inter', sans-serif" }}>
              {viewMonth.year}年 {monthNames[viewMonth.month]}
            </span>
            <button
              onClick={nextMonth}
              className="text-[var(--color-muted)] hover:text-[var(--color-deep-charcoal)] transition-colors text-sm px-2"
            >
              翌月 →
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
            {DAY_LABELS.map((d) => (
              <span key={d} className="text-[var(--color-muted)] pb-2">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarDays.map((day, i) => {
              if (day === null) return <span key={`e-${i}`} />;
              const ds = dateStr(day);
              const past = isDatePast(day);
              const monday = isMonday(day);
              const disabled = past || monday;
              const selected = ds === selectedDate;
              return (
                <button
                  key={day}
                  disabled={disabled}
                  onClick={() => {
                    setSelectedDate(ds);
                    setSelectedTime(null);
                  }}
                  className={`py-2 text-xs transition-colors ${
                    disabled
                      ? "text-[var(--color-border)] cursor-not-allowed"
                      : selected
                      ? "bg-[var(--color-antique-gold)] text-white font-medium"
                      : "text-[var(--color-deep-charcoal)] hover:bg-[var(--color-antique-gold)]/10"
                  }`}
                  style={{ borderRadius: "4px", fontFamily: "'Inter', sans-serif" }}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {selectedDate && (
            <p className="mt-4 text-xs text-[var(--color-muted)] text-center">
              ※ 月曜日は定休日です
            </p>
          )}
        </div>

        {/* Time Slots */}
        <div className="flex-1">
          {selectedDate ? (
            <>
              <p className="text-sm font-medium mb-4 tracking-wide">
                {selectedDate.replace(/-/g, "/")} の空き枠
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const available = availableSlots.includes(slot);
                  const selected = slot === selectedTime;
                  return (
                    <button
                      key={slot}
                      disabled={!available}
                      onClick={() => setSelectedTime(slot)}
                      className={`py-2.5 text-xs tracking-wider border transition-colors ${
                        !available
                          ? "border-[var(--color-border)] text-[var(--color-border)] cursor-not-allowed line-through"
                          : selected
                          ? "border-[var(--color-antique-gold)] bg-[var(--color-antique-gold)] text-white"
                          : "border-[var(--color-border)] text-[var(--color-deep-charcoal)] hover:border-[var(--color-antique-gold)]"
                      }`}
                      style={{ borderRadius: "4px", fontFamily: "'Inter', sans-serif" }}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-[var(--color-muted)]">
              カレンダーから日付を選択してください
            </div>
          )}
        </div>
      </div>

      {selectedDate && selectedTime && (
        <div className="mt-10 text-center">
          <button
            onClick={handleConfirm}
            className="px-10 py-3.5 text-sm tracking-[0.15em] text-[var(--color-warm-ivory)] bg-[var(--color-deep-charcoal)] hover:opacity-90 transition-opacity"
            style={{ borderRadius: "4px" }}
          >
            この日時で予約する
          </button>
        </div>
      )}
    </>
  );
}
