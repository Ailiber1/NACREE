"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface BookingRow {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  created_at: string;
  profiles?: { full_name: string | null; phone: string | null } | null;
  staff?: { name: string | null } | null;
  menus?: { name: string; price: number; duration_min: number } | null;
}

const STATUSES = ["confirmed", "visited", "cancelled", "no_show"] as const;

const STATUS_LABELS: Record<string, string> = {
  confirmed: "確定",
  visited: "来店済",
  cancelled: "キャンセル",
  no_show: "ノーショー",
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#B8956A",
  visited: "#8FA98F",
  cancelled: "rgba(26,26,26,0.4)",
  no_show: "#C75050",
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("bookings")
      .select(
        "*, profiles:customer_id(full_name, phone), staff(name), menus:menu_id(name, price, duration_min)"
      )
      .order("date", { ascending: false })
      .order("start_time", { ascending: false })
      .limit(100);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }
    if (dateFilter) {
      query = query.eq("date", dateFilter);
    }

    const { data } = await query;
    setBookings((data || []) as BookingRow[]);
    setLoading(false);
  }, [statusFilter, dateFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const updateStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingId(bookingId);
    const supabase = createClient();
    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", bookingId);

    if (!error) {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
    }
    setUpdatingId(null);
  };

  const filteredBookings = bookings.filter((b) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const customerName = (b.profiles as { full_name: string | null } | null)?.full_name || "";
    const menuName = b.menus?.name || "";
    const staffName = b.staff?.name || "";
    return (
      customerName.toLowerCase().includes(s) ||
      menuName.toLowerCase().includes(s) ||
      staffName.toLowerCase().includes(s) ||
      b.id.toLowerCase().includes(s)
    );
  });

  const formatPrice = (n: number) => new Intl.NumberFormat("ja-JP").format(n);

  return (
    <div className="space-y-6">
      <h2
        className="text-lg font-medium"
        style={{ fontFamily: "'Noto Serif JP', serif" }}
      >
        予約一覧
      </h2>

      {/* フィルター */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="顧客名・メニュー・スタッフで検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 text-sm rounded-lg outline-none"
          style={{
            border: "1px solid rgba(26,26,26,0.12)",
            backgroundColor: "#fff",
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 text-sm rounded-lg outline-none"
          style={{
            border: "1px solid rgba(26,26,26,0.12)",
            backgroundColor: "#fff",
            color: "#1A1A1A",
          }}
        >
          <option value="all">すべてのステータス</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2 text-sm rounded-lg outline-none"
          style={{
            border: "1px solid rgba(26,26,26,0.12)",
            backgroundColor: "#fff",
            color: "#1A1A1A",
          }}
        />
        {dateFilter && (
          <button
            onClick={() => setDateFilter("")}
            className="px-3 py-2 text-xs rounded-lg"
            style={{ border: "1px solid rgba(26,26,26,0.12)", color: "rgba(26,26,26,0.6)" }}
          >
            日付クリア
          </button>
        )}
      </div>

      {/* テーブル */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ backgroundColor: "#fff", border: "1px solid rgba(26,26,26,0.08)" }}
      >
        {loading ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm" style={{ color: "rgba(26,26,26,0.5)" }}>読み込み中...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm" style={{ color: "rgba(26,26,26,0.5)" }}>予約が見つかりません</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "rgba(26,26,26,0.02)" }}>
                  <th className="px-4 py-3 text-left font-medium text-xs" style={{ color: "rgba(26,26,26,0.5)" }}>日付</th>
                  <th className="px-4 py-3 text-left font-medium text-xs" style={{ color: "rgba(26,26,26,0.5)" }}>時間</th>
                  <th className="px-4 py-3 text-left font-medium text-xs" style={{ color: "rgba(26,26,26,0.5)" }}>顧客</th>
                  <th className="px-4 py-3 text-left font-medium text-xs" style={{ color: "rgba(26,26,26,0.5)" }}>メニュー</th>
                  <th className="px-4 py-3 text-left font-medium text-xs" style={{ color: "rgba(26,26,26,0.5)" }}>担当</th>
                  <th className="px-4 py-3 text-left font-medium text-xs" style={{ color: "rgba(26,26,26,0.5)" }}>金額</th>
                  <th className="px-4 py-3 text-left font-medium text-xs" style={{ color: "rgba(26,26,26,0.5)" }}>ステータス</th>
                  <th className="px-4 py-3 text-left font-medium text-xs" style={{ color: "rgba(26,26,26,0.5)" }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-t"
                    style={{ borderColor: "rgba(26,26,26,0.06)" }}
                  >
                    <td className="px-4 py-3 whitespace-nowrap" style={{ fontFamily: "Inter" }}>
                      {booking.date}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ fontFamily: "Inter" }}>
                      {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}
                    </td>
                    <td className="px-4 py-3">
                      {(booking.profiles as { full_name: string | null } | null)?.full_name || "—"}
                    </td>
                    <td className="px-4 py-3">{booking.menus?.name || "—"}</td>
                    <td className="px-4 py-3">{booking.staff?.name || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ fontFamily: "Inter" }}>
                      ¥{formatPrice(booking.menus?.price || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: `${STATUS_COLORS[booking.status]}15`,
                          color: STATUS_COLORS[booking.status],
                        }}
                      >
                        {STATUS_LABELS[booking.status] || booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={booking.status}
                        onChange={(e) => updateStatus(booking.id, e.target.value)}
                        disabled={updatingId === booking.id}
                        className="px-2 py-1 text-xs rounded outline-none disabled:opacity-50"
                        style={{
                          border: "1px solid rgba(26,26,26,0.12)",
                          backgroundColor: "#fff",
                          color: "#1A1A1A",
                        }}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs" style={{ color: "rgba(26,26,26,0.4)" }}>
        表示: {filteredBookings.length}件
      </p>
    </div>
  );
}
