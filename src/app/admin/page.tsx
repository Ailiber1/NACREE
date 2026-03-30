"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface BookingWithDetails {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  customer_id: string;
  staff_id: string;
  menu_id: string;
  profiles?: { full_name: string | null } | null;
  staff?: { name: string | null } | null;
  menus?: { name: string; price: number; duration_min: number } | null;
}

interface DayOccupancy {
  day: string;
  rate: number;
}

export default function AdminDashboardPage() {
  const [todayBookings, setTodayBookings] = useState<BookingWithDetails[]>([]);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [totalBookingsCount, setTotalBookingsCount] = useState(0);
  const [occupancyData, setOccupancyData] = useState<DayOccupancy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];
    const monthStart = today.slice(0, 7) + "-01";

    // 今日の予約
    const { data: todayData } = await supabase
      .from("bookings")
      .select("*, profiles:customer_id(full_name), staff(name), menus:menu_id(name, price, duration_min)")
      .eq("date", today)
      .order("start_time");

    const bookings = (todayData || []) as BookingWithDetails[];
    setTodayBookings(bookings);

    // 今日の売上
    const todayActive = bookings.filter(
      (b) => b.status === "confirmed" || b.status === "visited"
    );
    const todayRev = todayActive.reduce(
      (sum, b) => sum + (b.menus?.price || 0),
      0
    );
    setTodayRevenue(todayRev);

    // 今月の予約と売上
    const { data: monthData } = await supabase
      .from("bookings")
      .select("*, menus:menu_id(price)")
      .gte("date", monthStart)
      .lte("date", today)
      .in("status", ["confirmed", "visited"]);

    const monthRev = (monthData || []).reduce(
      (sum: number, b: { menus?: { price: number } | null }) => sum + (b.menus?.price || 0),
      0
    );
    setMonthRevenue(monthRev);
    setTotalBookingsCount((monthData || []).length);

    // 過去7日間の稼働率
    const days: DayOccupancy[] = [];
    const dayLabels = ["日", "月", "火", "水", "木", "金", "土"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const { count } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("date", dateStr)
        .in("status", ["confirmed", "visited"]);

      // 1日の最大枠数を仮に20枠とする（スタッフ数 x 営業時間から算出すべきだが簡易計算）
      const maxSlots = 20;
      const rate = Math.min(Math.round(((count || 0) / maxSlots) * 100), 100);
      days.push({ day: dayLabels[d.getDay()], rate });
    }
    setOccupancyData(days);
    setLoading(false);
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ja-JP").format(price);

  const statusLabel: Record<string, string> = {
    confirmed: "確定",
    visited: "来店済",
    cancelled: "キャンセル",
    no_show: "ノーショー",
  };

  const statusColor: Record<string, string> = {
    confirmed: "#B8956A",
    visited: "#8FA98F",
    cancelled: "rgba(26,26,26,0.4)",
    no_show: "#C75050",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm" style={{ color: "rgba(26,26,26,0.5)" }}>
          読み込み中...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* サマリーカード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="今日の予約" value={`${todayBookings.length}件`} />
        <SummaryCard
          label="今日の売上"
          value={`¥${formatPrice(todayRevenue)}`}
        />
        <SummaryCard
          label="今月の売上"
          value={`¥${formatPrice(monthRevenue)}`}
        />
        <SummaryCard label="今月の予約数" value={`${totalBookingsCount}件`} />
      </div>

      {/* 稼働率グラフ */}
      <div
        className="rounded-lg p-6"
        style={{
          backgroundColor: "#fff",
          border: "1px solid rgba(26,26,26,0.08)",
        }}
      >
        <h2
          className="text-base font-medium mb-4"
          style={{ fontFamily: "'Noto Serif JP', serif" }}
        >
          過去7日間の稼働率
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={occupancyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,26,0.06)" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: "rgba(26,26,26,0.6)" }}
                axisLine={{ stroke: "rgba(26,26,26,0.1)" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "rgba(26,26,26,0.6)" }}
                axisLine={{ stroke: "rgba(26,26,26,0.1)" }}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, "稼働率"]}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid rgba(26,26,26,0.1)",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              />
              <Bar dataKey="rate" fill="#B8956A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 今日の予約一覧 */}
      <div
        className="rounded-lg overflow-hidden"
        style={{
          backgroundColor: "#fff",
          border: "1px solid rgba(26,26,26,0.08)",
        }}
      >
        <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(26,26,26,0.08)" }}>
          <h2
            className="text-base font-medium"
            style={{ fontFamily: "'Noto Serif JP', serif" }}
          >
            今日の予約
          </h2>
        </div>
        {todayBookings.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm" style={{ color: "rgba(26,26,26,0.5)" }}>
              今日の予約はありません
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "rgba(26,26,26,0.02)" }}>
                  <th className="px-6 py-3 text-left font-medium" style={{ color: "rgba(26,26,26,0.5)" }}>時間</th>
                  <th className="px-6 py-3 text-left font-medium" style={{ color: "rgba(26,26,26,0.5)" }}>顧客名</th>
                  <th className="px-6 py-3 text-left font-medium" style={{ color: "rgba(26,26,26,0.5)" }}>メニュー</th>
                  <th className="px-6 py-3 text-left font-medium" style={{ color: "rgba(26,26,26,0.5)" }}>担当</th>
                  <th className="px-6 py-3 text-left font-medium" style={{ color: "rgba(26,26,26,0.5)" }}>ステータス</th>
                </tr>
              </thead>
              <tbody>
                {todayBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-t"
                    style={{ borderColor: "rgba(26,26,26,0.06)" }}
                  >
                    <td className="px-6 py-3" style={{ fontFamily: "Inter" }}>
                      {booking.start_time?.slice(0, 5)}
                    </td>
                    <td className="px-6 py-3">
                      {(booking.profiles as { full_name: string | null } | null)?.full_name || "未設定"}
                    </td>
                    <td className="px-6 py-3">{booking.menus?.name || "—"}</td>
                    <td className="px-6 py-3">{booking.staff?.name || "—"}</td>
                    <td className="px-6 py-3">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: `${statusColor[booking.status]}15`,
                          color: statusColor[booking.status],
                        }}
                      >
                        {statusLabel[booking.status] || booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg p-5"
      style={{
        backgroundColor: "#fff",
        border: "1px solid rgba(26,26,26,0.08)",
      }}
    >
      <p className="text-xs mb-1" style={{ color: "rgba(26,26,26,0.5)" }}>
        {label}
      </p>
      <p
        className="text-2xl font-semibold"
        style={{ fontFamily: "Inter", color: "#1A1A1A" }}
      >
        {value}
      </p>
    </div>
  );
}
