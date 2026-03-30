"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface CalendarBooking {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  profiles?: { full_name: string | null } | null;
  staff?: { name: string | null } | null;
  menus?: { name: string; duration_min: number } | null;
}

type ViewMode = "week" | "month";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#B8956A",
  visited: "#8FA98F",
  cancelled: "rgba(26,26,26,0.3)",
  no_show: "#C75050",
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "確定",
  visited: "来店済",
  cancelled: "キャンセル",
  no_show: "ノーショー",
};

export default function AdminCalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const getWeekDays = useCallback(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    start.setDate(start.getDate() - day);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  const getMonthDays = useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const days: (Date | null)[] = [];

    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentDate]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let startDate: string;
    let endDate: string;

    if (viewMode === "week") {
      const days = getWeekDays();
      startDate = days[0].toISOString().split("T")[0];
      endDate = days[6].toISOString().split("T")[0];
    } else {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      startDate = new Date(year, month, 1).toISOString().split("T")[0];
      endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];
    }

    const { data } = await supabase
      .from("bookings")
      .select(
        "*, profiles:customer_id(full_name), staff(name), menus:menu_id(name, duration_min)"
      )
      .gte("date", startDate)
      .lte("date", endDate)
      .order("start_time");

    setBookings((data || []) as CalendarBooking[]);
    setLoading(false);
  }, [viewMode, currentDate, getWeekDays]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const navigate = (direction: number) => {
    const next = new Date(currentDate);
    if (viewMode === "week") {
      next.setDate(next.getDate() + direction * 7);
    } else {
      next.setMonth(next.getMonth() + direction);
    }
    setCurrentDate(next);
  };

  const goToday = () => setCurrentDate(new Date());

  const getBookingsForDate = (dateStr: string) =>
    bookings.filter((b) => b.date === dateStr);

  const formatDateStr = (d: Date) => d.toISOString().split("T")[0];

  const todayStr = new Date().toISOString().split("T")[0];
  const dayLabels = ["日", "月", "火", "水", "木", "金", "土"];

  const headerLabel =
    viewMode === "week"
      ? (() => {
          const days = getWeekDays();
          const s = days[0];
          const e = days[6];
          return `${s.getFullYear()}年${s.getMonth() + 1}月${s.getDate()}日 〜 ${e.getMonth() + 1}月${e.getDate()}日`;
        })()
      : `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2
          className="text-lg font-medium"
          style={{ fontFamily: "'Noto Serif JP', serif" }}
        >
          予約カレンダー
        </h2>
        <div className="flex items-center gap-2">
          <div
            className="flex rounded-lg overflow-hidden"
            style={{ border: "1px solid rgba(26,26,26,0.12)" }}
          >
            <button
              onClick={() => setViewMode("week")}
              className="px-4 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: viewMode === "week" ? "#1A1A1A" : "transparent",
                color: viewMode === "week" ? "#FAF6F1" : "rgba(26,26,26,0.6)",
              }}
            >
              週間
            </button>
            <button
              onClick={() => setViewMode("month")}
              className="px-4 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: viewMode === "month" ? "#1A1A1A" : "transparent",
                color: viewMode === "month" ? "#FAF6F1" : "rgba(26,26,26,0.6)",
              }}
            >
              月間
            </button>
          </div>
        </div>
      </div>

      {/* ナビゲーション */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-1.5 text-sm rounded-lg transition-colors"
          style={{ border: "1px solid rgba(26,26,26,0.12)", color: "rgba(26,26,26,0.6)" }}
        >
          ← 前
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium" style={{ fontFamily: "Inter" }}>
            {headerLabel}
          </span>
          <button
            onClick={goToday}
            className="px-3 py-1 text-xs rounded transition-colors"
            style={{ backgroundColor: "#B8956A", color: "#fff" }}
          >
            今日
          </button>
        </div>
        <button
          onClick={() => navigate(1)}
          className="px-3 py-1.5 text-sm rounded-lg transition-colors"
          style={{ border: "1px solid rgba(26,26,26,0.12)", color: "rgba(26,26,26,0.6)" }}
        >
          次 →
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-sm" style={{ color: "rgba(26,26,26,0.5)" }}>読み込み中...</p>
        </div>
      ) : viewMode === "week" ? (
        /* 週間ビュー */
        <div
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: "#fff", border: "1px solid rgba(26,26,26,0.08)" }}
        >
          <div className="grid grid-cols-7">
            {getWeekDays().map((day, i) => {
              const dateStr = formatDateStr(day);
              const isToday = dateStr === todayStr;
              const dayBookings = getBookingsForDate(dateStr);

              return (
                <div
                  key={i}
                  className="border-r last:border-r-0"
                  style={{ borderColor: "rgba(26,26,26,0.06)", minHeight: "300px" }}
                >
                  <div
                    className="px-3 py-2 text-center border-b"
                    style={{
                      borderColor: "rgba(26,26,26,0.06)",
                      backgroundColor: isToday ? "rgba(184,149,106,0.08)" : "rgba(26,26,26,0.02)",
                    }}
                  >
                    <p className="text-xs" style={{ color: "rgba(26,26,26,0.5)" }}>
                      {dayLabels[day.getDay()]}
                    </p>
                    <p
                      className="text-sm font-medium mt-0.5"
                      style={{
                        fontFamily: "Inter",
                        color: isToday ? "#B8956A" : "#1A1A1A",
                      }}
                    >
                      {day.getDate()}
                    </p>
                  </div>
                  <div className="p-1.5 space-y-1">
                    {dayBookings.map((b) => (
                      <div
                        key={b.id}
                        className="rounded px-2 py-1 text-xs"
                        style={{
                          backgroundColor: `${STATUS_COLORS[b.status] || "#B8956A"}12`,
                          borderLeft: `3px solid ${STATUS_COLORS[b.status] || "#B8956A"}`,
                        }}
                      >
                        <p className="font-medium" style={{ fontFamily: "Inter" }}>
                          {b.start_time?.slice(0, 5)}
                        </p>
                        <p className="truncate" style={{ color: "rgba(26,26,26,0.7)" }}>
                          {(b.profiles as { full_name: string | null } | null)?.full_name || "顧客"}
                        </p>
                        <p className="truncate" style={{ color: "rgba(26,26,26,0.5)" }}>
                          {b.menus?.name || ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 月間ビュー */
        <div
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: "#fff", border: "1px solid rgba(26,26,26,0.08)" }}
        >
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7">
            {dayLabels.map((label) => (
              <div
                key={label}
                className="px-2 py-2 text-center text-xs font-medium border-b"
                style={{ color: "rgba(26,26,26,0.5)", borderColor: "rgba(26,26,26,0.06)", backgroundColor: "rgba(26,26,26,0.02)" }}
              >
                {label}
              </div>
            ))}
          </div>
          {/* 日付グリッド */}
          <div className="grid grid-cols-7">
            {getMonthDays().map((day, i) => {
              if (!day) {
                return (
                  <div
                    key={`empty-${i}`}
                    className="border-r border-b"
                    style={{ borderColor: "rgba(26,26,26,0.06)", minHeight: "90px" }}
                  />
                );
              }
              const dateStr = formatDateStr(day);
              const isToday = dateStr === todayStr;
              const dayBookings = getBookingsForDate(dateStr);

              return (
                <div
                  key={dateStr}
                  className="border-r border-b p-1.5"
                  style={{
                    borderColor: "rgba(26,26,26,0.06)",
                    minHeight: "90px",
                    backgroundColor: isToday ? "rgba(184,149,106,0.04)" : "transparent",
                  }}
                >
                  <p
                    className="text-xs font-medium mb-1"
                    style={{
                      fontFamily: "Inter",
                      color: isToday ? "#B8956A" : "rgba(26,26,26,0.7)",
                    }}
                  >
                    {day.getDate()}
                  </p>
                  {dayBookings.slice(0, 3).map((b) => (
                    <div
                      key={b.id}
                      className="rounded px-1.5 py-0.5 text-xs mb-0.5 truncate"
                      style={{
                        backgroundColor: `${STATUS_COLORS[b.status]}12`,
                        color: STATUS_COLORS[b.status],
                      }}
                    >
                      {b.start_time?.slice(0, 5)} {(b.profiles as { full_name: string | null } | null)?.full_name || ""}
                    </div>
                  ))}
                  {dayBookings.length > 3 && (
                    <p className="text-xs px-1.5" style={{ color: "rgba(26,26,26,0.4)" }}>
                      +{dayBookings.length - 3}件
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {/* 凡例 */}
          <div className="px-4 py-3 flex flex-wrap gap-4 border-t" style={{ borderColor: "rgba(26,26,26,0.06)" }}>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: STATUS_COLORS[key] }}
                />
                <span className="text-xs" style={{ color: "rgba(26,26,26,0.6)" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
