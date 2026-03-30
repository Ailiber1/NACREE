"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface CustomerProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
}

interface CustomerBooking {
  id: string;
  date: string;
  start_time: string;
  status: string;
  menus?: { name: string; price: number } | null;
  staff?: { name: string | null } | null;
}

interface CustomerDetail {
  profile: CustomerProfile;
  bookings: CustomerBooking[];
  totalSpent: number;
  visitCount: number;
  lastVisit: string | null;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [memo, setMemo] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "created">("created");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "customer")
      .order("created_at", { ascending: false });

    setCustomers((data || []) as CustomerProfile[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const openDetail = async (customer: CustomerProfile) => {
    setDetailLoading(true);
    setSelectedCustomer(null);
    const supabase = createClient();

    const { data: bookings } = await supabase
      .from("bookings")
      .select("*, menus:menu_id(name, price), staff(name)")
      .eq("customer_id", customer.id)
      .order("date", { ascending: false });

    const bks = (bookings || []) as CustomerBooking[];
    const visited = bks.filter((b) => b.status === "visited");
    const totalSpent = visited.reduce(
      (sum, b) => sum + (b.menus?.price || 0),
      0
    );
    const lastVisit = visited.length > 0 ? visited[0].date : null;

    setSelectedCustomer({
      profile: customer,
      bookings: bks,
      totalSpent,
      visitCount: visited.length,
      lastVisit,
    });

    // メモをlocalStorageから取得（簡易実装。本来はDBカラム）
    const savedMemo = localStorage.getItem(`customer_memo_${customer.id}`);
    setMemo(savedMemo || "");
    setDetailLoading(false);
  };

  const saveMemo = () => {
    if (selectedCustomer) {
      localStorage.setItem(
        `customer_memo_${selectedCustomer.profile.id}`,
        memo
      );
    }
  };

  const filteredCustomers = customers
    .filter((c) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        (c.full_name || "").toLowerCase().includes(s) ||
        (c.phone || "").includes(s)
      );
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return (a.full_name || "").localeCompare(b.full_name || "");
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const formatPrice = (n: number) => new Intl.NumberFormat("ja-JP").format(n);

  const STATUS_LABELS: Record<string, string> = {
    confirmed: "確定",
    visited: "来店済",
    cancelled: "キャンセル",
    no_show: "ノーショー",
  };

  return (
    <div className="space-y-6">
      <h2
        className="text-lg font-medium"
        style={{ fontFamily: "'Noto Serif JP', serif" }}
      >
        顧客管理
      </h2>

      {/* フィルター */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="顧客名・電話番号で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 text-sm rounded-lg outline-none"
          style={{ border: "1px solid rgba(26,26,26,0.12)", backgroundColor: "#fff" }}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "name" | "created")}
          className="px-4 py-2 text-sm rounded-lg outline-none"
          style={{ border: "1px solid rgba(26,26,26,0.12)", backgroundColor: "#fff", color: "#1A1A1A" }}
        >
          <option value="created">登録日順</option>
          <option value="name">名前順</option>
        </select>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* 顧客一覧 */}
        <div
          className="flex-1 rounded-lg overflow-hidden"
          style={{ backgroundColor: "#fff", border: "1px solid rgba(26,26,26,0.08)" }}
        >
          {loading ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm" style={{ color: "rgba(26,26,26,0.5)" }}>読み込み中...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm" style={{ color: "rgba(26,26,26,0.5)" }}>顧客が見つかりません</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(26,26,26,0.06)" }}>
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => openDetail(customer)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between transition-colors hover:bg-[rgba(26,26,26,0.02)]"
                  style={{
                    backgroundColor:
                      selectedCustomer?.profile.id === customer.id
                        ? "rgba(184,149,106,0.06)"
                        : "transparent",
                  }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                      {customer.full_name || "名前未設定"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(26,26,26,0.5)" }}>
                      {customer.phone || "電話番号未設定"}
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: "rgba(26,26,26,0.4)", fontFamily: "Inter" }}>
                    {new Date(customer.created_at).toLocaleDateString("ja-JP")}
                  </p>
                </button>
              ))}
            </div>
          )}
          <div className="px-5 py-3 border-t" style={{ borderColor: "rgba(26,26,26,0.06)" }}>
            <p className="text-xs" style={{ color: "rgba(26,26,26,0.4)" }}>
              {filteredCustomers.length}件
            </p>
          </div>
        </div>

        {/* 顧客詳細 */}
        <div
          className="lg:w-96 rounded-lg"
          style={{ backgroundColor: "#fff", border: "1px solid rgba(26,26,26,0.08)" }}
        >
          {detailLoading ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm" style={{ color: "rgba(26,26,26,0.5)" }}>読み込み中...</p>
            </div>
          ) : !selectedCustomer ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm" style={{ color: "rgba(26,26,26,0.5)" }}>
                顧客を選択してください
              </p>
            </div>
          ) : (
            <div>
              {/* プロフィール */}
              <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(26,26,26,0.06)" }}>
                <h3 className="text-base font-medium" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                  {selectedCustomer.profile.full_name || "名前未設定"}
                </h3>
                <p className="text-xs mt-1" style={{ color: "rgba(26,26,26,0.5)" }}>
                  {selectedCustomer.profile.phone || "電話番号未設定"}
                </p>
              </div>

              {/* KPI */}
              <div className="grid grid-cols-3 border-b" style={{ borderColor: "rgba(26,26,26,0.06)" }}>
                <div className="px-4 py-3 text-center border-r" style={{ borderColor: "rgba(26,26,26,0.06)" }}>
                  <p className="text-xs" style={{ color: "rgba(26,26,26,0.5)" }}>来店回数</p>
                  <p className="text-lg font-semibold mt-0.5" style={{ fontFamily: "Inter" }}>
                    {selectedCustomer.visitCount}
                  </p>
                </div>
                <div className="px-4 py-3 text-center border-r" style={{ borderColor: "rgba(26,26,26,0.06)" }}>
                  <p className="text-xs" style={{ color: "rgba(26,26,26,0.5)" }}>LTV</p>
                  <p className="text-lg font-semibold mt-0.5" style={{ fontFamily: "Inter" }}>
                    ¥{formatPrice(selectedCustomer.totalSpent)}
                  </p>
                </div>
                <div className="px-4 py-3 text-center">
                  <p className="text-xs" style={{ color: "rgba(26,26,26,0.5)" }}>最終来店</p>
                  <p className="text-sm font-medium mt-1" style={{ fontFamily: "Inter" }}>
                    {selectedCustomer.lastVisit || "—"}
                  </p>
                </div>
              </div>

              {/* メモ */}
              <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(26,26,26,0.06)" }}>
                <p className="text-xs font-medium mb-2" style={{ color: "rgba(26,26,26,0.5)" }}>
                  メモ
                </p>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  onBlur={saveMemo}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none"
                  style={{ border: "1px solid rgba(26,26,26,0.1)", backgroundColor: "rgba(26,26,26,0.02)" }}
                  placeholder="顧客メモを入力..."
                />
              </div>

              {/* 来店履歴 */}
              <div className="px-5 py-4">
                <p className="text-xs font-medium mb-3" style={{ color: "rgba(26,26,26,0.5)" }}>
                  来店履歴
                </p>
                {selectedCustomer.bookings.length === 0 ? (
                  <p className="text-xs" style={{ color: "rgba(26,26,26,0.4)" }}>
                    予約履歴がありません
                  </p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedCustomer.bookings.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between py-2 border-b last:border-b-0"
                        style={{ borderColor: "rgba(26,26,26,0.04)" }}
                      >
                        <div>
                          <p className="text-xs font-medium" style={{ fontFamily: "Inter" }}>
                            {b.date} {b.start_time?.slice(0, 5)}
                          </p>
                          <p className="text-xs" style={{ color: "rgba(26,26,26,0.6)" }}>
                            {b.menus?.name || "—"} / {b.staff?.name || "—"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs" style={{ fontFamily: "Inter" }}>
                            ¥{formatPrice(b.menus?.price || 0)}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "rgba(26,26,26,0.5)" }}
                          >
                            {STATUS_LABELS[b.status] || b.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
