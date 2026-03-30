"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface MonthlyData {
  month: string;
  revenue: number;
  count: number;
}

interface StaffRevenue {
  name: string;
  revenue: number;
  count: number;
}

interface MenuRevenue {
  name: string;
  revenue: number;
  count: number;
}

const COLORS = ["#B8956A", "#8FA98F", "#D4A574", "#6B8E6B", "#C5A882", "#7BA07B", "#A88B6A", "#5C8C5C"];

export default function ReportsPage() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [staffData, setStaffData] = useState<StaffRevenue[]>([]);
  const [menuData, setMenuData] = useState<MenuRevenue[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    // 選択年の全予約を取得
    const startDate = `${selectedYear}-01-01`;
    const endDate = `${selectedYear}-12-31`;

    const { data: bookings } = await supabase
      .from("bookings")
      .select("*, menus:menu_id(name, price), staff(name)")
      .gte("date", startDate)
      .lte("date", endDate)
      .in("status", ["confirmed", "visited"]);

    const items = bookings || [];

    // 月別集計
    const monthMap = new Map<string, { revenue: number; count: number }>();
    for (let m = 1; m <= 12; m++) {
      const key = `${m}月`;
      monthMap.set(key, { revenue: 0, count: 0 });
    }
    items.forEach((b: Record<string, unknown>) => {
      const date = b.date as string;
      const month = parseInt(date.split("-")[1], 10);
      const key = `${month}月`;
      const existing = monthMap.get(key)!;
      const menu = b.menus as { price: number } | null;
      existing.revenue += menu?.price || 0;
      existing.count += 1;
    });
    setMonthlyData(
      Array.from(monthMap.entries()).map(([month, d]) => ({
        month,
        revenue: d.revenue,
        count: d.count,
      }))
    );

    // スタッフ別集計
    const staffMap = new Map<string, { revenue: number; count: number }>();
    items.forEach((b: Record<string, unknown>) => {
      const staff = b.staff as { name: string } | null;
      const name = staff?.name || "指名なし";
      const existing = staffMap.get(name) || { revenue: 0, count: 0 };
      const menu = b.menus as { price: number } | null;
      existing.revenue += menu?.price || 0;
      existing.count += 1;
      staffMap.set(name, existing);
    });
    setStaffData(
      Array.from(staffMap.entries())
        .map(([name, d]) => ({ name, ...d }))
        .sort((a, b) => b.revenue - a.revenue)
    );

    // メニュー別集計
    const menuMap = new Map<string, { revenue: number; count: number }>();
    items.forEach((b: Record<string, unknown>) => {
      const menu = b.menus as { name: string; price: number } | null;
      const name = menu?.name || "不明";
      const existing = menuMap.get(name) || { revenue: 0, count: 0 };
      existing.revenue += menu?.price || 0;
      existing.count += 1;
      menuMap.set(name, existing);
    });
    setMenuData(
      Array.from(menuMap.entries())
        .map(([name, d]) => ({ name, ...d }))
        .sort((a, b) => b.revenue - a.revenue)
    );

    setLoading(false);
  }, [selectedYear]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  function exportCSV() {
    const rows = [
      ["月", "売上(円)", "予約数"],
      ...monthlyData.map((d) => [d.month, String(d.revenue), String(d.count)]),
      [],
      ["スタッフ", "売上(円)", "予約数"],
      ...staffData.map((d) => [d.name, String(d.revenue), String(d.count)]),
      [],
      ["メニュー", "売上(円)", "予約数"],
      ...menuData.map((d) => [d.name, String(d.revenue), String(d.count)]),
    ];

    const bom = "\uFEFF";
    const csvContent = bom + rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `NACREE_売上レポート_${selectedYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const formatPrice = (v: number) => `\u00a5${new Intl.NumberFormat("ja-JP").format(v)}`;
  const totalRevenue = monthlyData.reduce((sum, d) => sum + d.revenue, 0);
  const totalCount = monthlyData.reduce((sum, d) => sum + d.count, 0);

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
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1
          className="text-xl font-medium"
          style={{ fontFamily: "'Noto Serif JP', serif" }}
        >
          売上レポート
        </h1>
        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 text-sm border bg-white"
            style={{
              borderColor: "var(--color-border)",
              borderRadius: "6px",
              outline: "none",
            }}
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}年
              </option>
            ))}
          </select>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 text-sm tracking-wider text-white transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "var(--color-antique-gold)",
              borderRadius: "6px",
            }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            CSV出力
          </button>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="rounded-lg p-5"
          style={{
            backgroundColor: "#fff",
            border: "1px solid rgba(26,26,26,0.08)",
          }}
        >
          <p className="text-xs mb-1" style={{ color: "rgba(26,26,26,0.5)" }}>
            年間売上
          </p>
          <p
            className="text-2xl font-semibold"
            style={{ fontFamily: "Inter", color: "#1A1A1A" }}
          >
            {formatPrice(totalRevenue)}
          </p>
        </div>
        <div
          className="rounded-lg p-5"
          style={{
            backgroundColor: "#fff",
            border: "1px solid rgba(26,26,26,0.08)",
          }}
        >
          <p className="text-xs mb-1" style={{ color: "rgba(26,26,26,0.5)" }}>
            年間予約数
          </p>
          <p
            className="text-2xl font-semibold"
            style={{ fontFamily: "Inter", color: "#1A1A1A" }}
          >
            {totalCount}件
          </p>
        </div>
        <div
          className="rounded-lg p-5"
          style={{
            backgroundColor: "#fff",
            border: "1px solid rgba(26,26,26,0.08)",
          }}
        >
          <p className="text-xs mb-1" style={{ color: "rgba(26,26,26,0.5)" }}>
            平均単価
          </p>
          <p
            className="text-2xl font-semibold"
            style={{ fontFamily: "Inter", color: "#1A1A1A" }}
          >
            {totalCount > 0
              ? formatPrice(Math.round(totalRevenue / totalCount))
              : "\u00a50"}
          </p>
        </div>
      </div>

      {/* 月別売上グラフ */}
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
          月別売上推移
        </h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(26,26,26,0.06)"
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "rgba(26,26,26,0.6)" }}
                axisLine={{ stroke: "rgba(26,26,26,0.1)" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "rgba(26,26,26,0.6)" }}
                axisLine={{ stroke: "rgba(26,26,26,0.1)" }}
                tickFormatter={(v) =>
                  v >= 10000 ? `${v / 10000}万` : `${v}`
                }
              />
              <Tooltip
                formatter={(value) => [formatPrice(Number(value)), "売上"]}
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid rgba(26,26,26,0.1)",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              />
              <Bar dataKey="revenue" fill="#B8956A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* スタッフ別・メニュー別 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* スタッフ別売上 */}
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
            スタッフ別売上
          </h2>
          {staffData.length === 0 ? (
            <p
              className="text-sm text-center py-8"
              style={{ color: "rgba(26,26,26,0.4)" }}
            >
              データなし
            </p>
          ) : (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={staffData}
                      dataKey="revenue"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {staffData.map((_, i) => (
                        <Cell
                          key={`staff-${i}`}
                          fill={COLORS[i % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [formatPrice(Number(value)), "売上"]}
                      contentStyle={{
                        fontSize: "12px",
                        borderRadius: "6px",
                        border: "1px solid rgba(26,26,26,0.1)",
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {staffData.map((s, i) => (
                  <div
                    key={s.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-sm"
                        style={{
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      />
                      <span>{s.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span style={{ fontFamily: "Inter" }}>
                        {formatPrice(s.revenue)}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "rgba(26,26,26,0.5)" }}
                      >
                        {s.count}件
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* メニュー別売上 */}
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
            メニュー別売上
          </h2>
          {menuData.length === 0 ? (
            <p
              className="text-sm text-center py-8"
              style={{ color: "rgba(26,26,26,0.4)" }}
            >
              データなし
            </p>
          ) : (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={menuData.slice(0, 6)}
                    layout="vertical"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(26,26,26,0.06)"
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "rgba(26,26,26,0.6)" }}
                      tickFormatter={(v) =>
                        v >= 10000 ? `${v / 10000}万` : `${v}`
                      }
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "rgba(26,26,26,0.6)" }}
                      width={100}
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatPrice(Number(value)),
                        "売上",
                      ]}
                      contentStyle={{
                        fontSize: "12px",
                        borderRadius: "6px",
                        border: "1px solid rgba(26,26,26,0.1)",
                      }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#8FA98F"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {menuData.map((m, i) => (
                  <div
                    key={m.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-sm"
                        style={{
                          backgroundColor: COLORS[(i + 2) % COLORS.length],
                        }}
                      />
                      <span className="truncate max-w-[150px]">{m.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span style={{ fontFamily: "Inter" }}>
                        {formatPrice(m.revenue)}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "rgba(26,26,26,0.5)" }}
                      >
                        {m.count}件
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
