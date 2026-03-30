"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Staff, StaffSchedule } from "@/lib/supabase/types";

interface StaffWithStats extends Staff {
  totalBookings: number;
  nominationRate: number;
}

interface ScheduleForm {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const DAY_LABELS = ["日曜", "月曜", "火曜", "水曜", "木曜", "金曜", "土曜"];
const DEFAULT_START = "10:00";
const DEFAULT_END = "19:00";

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState<StaffWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<StaffWithStats | null>(null);
  const [schedules, setSchedules] = useState<ScheduleForm[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    title: "",
    bio: "",
    specialties: "",
    image_url: "",
    is_active: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const { data: staffData } = await supabase
      .from("staff")
      .select("*")
      .order("created_at");

    const staffArr = (staffData || []) as Staff[];

    // 各スタッフの予約数と指名率を取得
    const statsPromises = staffArr.map(async (s) => {
      const { count: total } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("staff_id", s.id)
        .in("status", ["confirmed", "visited"]);

      const { count: allBookings } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .in("status", ["confirmed", "visited"]);

      const rate =
        allBookings && allBookings > 0
          ? Math.round(((total || 0) / allBookings) * 100)
          : 0;

      return {
        ...s,
        totalBookings: total || 0,
        nominationRate: rate,
      };
    });

    const staffWithStats = await Promise.all(statsPromises);
    setStaffList(staffWithStats);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const selectStaff = async (staff: StaffWithStats) => {
    setSelectedStaff(staff);
    setScheduleLoading(true);

    const supabase = createClient();
    const { data } = await supabase
      .from("staff_schedules")
      .select("*")
      .eq("staff_id", staff.id)
      .order("day_of_week");

    const existing = (data || []) as StaffSchedule[];

    // 全7曜日分のフォームを作成
    const scheduleForms: ScheduleForm[] = [];
    for (let i = 0; i < 7; i++) {
      const found = existing.find((s) => s.day_of_week === i);
      if (found) {
        scheduleForms.push({
          day_of_week: i,
          start_time: found.start_time.slice(0, 5),
          end_time: found.end_time.slice(0, 5),
          is_available: found.is_available,
        });
      } else {
        scheduleForms.push({
          day_of_week: i,
          start_time: DEFAULT_START,
          end_time: DEFAULT_END,
          is_available: i !== 0, // 日曜休み
        });
      }
    }
    setSchedules(scheduleForms);
    setScheduleLoading(false);
  };

  const updateSchedule = (dayIndex: number, field: string, value: string | boolean) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.day_of_week === dayIndex ? { ...s, [field]: value } : s
      )
    );
  };

  const saveSchedules = async () => {
    if (!selectedStaff) return;
    setSaving(true);
    const supabase = createClient();

    // 既存を削除して再挿入
    await supabase
      .from("staff_schedules")
      .delete()
      .eq("staff_id", selectedStaff.id);

    const rows = schedules.map((s) => ({
      staff_id: selectedStaff.id,
      day_of_week: s.day_of_week,
      start_time: s.start_time + ":00",
      end_time: s.end_time + ":00",
      is_available: s.is_available,
    }));

    await supabase.from("staff_schedules").insert(rows);
    setSaving(false);
    alert("シフトを保存しました");
  };

  const openEditProfile = (staff: StaffWithStats) => {
    setEditingId(staff.id);
    setEditForm({
      name: staff.name || "",
      title: staff.title || "",
      bio: staff.bio || "",
      specialties: (staff.specialties || []).join(", "),
      image_url: staff.image_url || "",
      is_active: staff.is_active,
    });
    setShowEditModal(true);
  };

  const saveProfile = async () => {
    if (!editingId) return;
    setSaving(true);
    const supabase = createClient();

    const specialtiesArr = editForm.specialties
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    await supabase
      .from("staff")
      .update({
        name: editForm.name || null,
        title: editForm.title || null,
        bio: editForm.bio || null,
        specialties: specialtiesArr.length > 0 ? specialtiesArr : null,
        image_url: editForm.image_url || null,
        is_active: editForm.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingId);

    setSaving(false);
    setShowEditModal(false);
    fetchStaff();
  };

  return (
    <div className="space-y-6">
      <h2
        className="text-lg font-medium"
        style={{ fontFamily: "'Noto Serif JP', serif" }}
      >
        スタッフ管理
      </h2>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* スタッフ一覧 */}
        <div
          className="lg:w-80 rounded-lg overflow-hidden"
          style={{ backgroundColor: "#fff", border: "1px solid rgba(26,26,26,0.08)" }}
        >
          <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(26,26,26,0.06)" }}>
            <p className="text-xs font-medium" style={{ color: "rgba(26,26,26,0.5)" }}>
              スタッフ一覧
            </p>
          </div>
          {loading ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm" style={{ color: "rgba(26,26,26,0.5)" }}>読み込み中...</p>
            </div>
          ) : staffList.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm" style={{ color: "rgba(26,26,26,0.5)" }}>スタッフがいません</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(26,26,26,0.06)" }}>
              {staffList.map((staff) => (
                <button
                  key={staff.id}
                  onClick={() => selectStaff(staff)}
                  className="w-full px-5 py-4 text-left transition-colors hover:bg-[rgba(26,26,26,0.02)]"
                  style={{
                    backgroundColor:
                      selectedStaff?.id === staff.id
                        ? "rgba(184,149,106,0.06)"
                        : "transparent",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium"
                      style={{
                        backgroundColor: "rgba(184,149,106,0.1)",
                        color: "#B8956A",
                      }}
                    >
                      {(staff.name || "?").charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium flex items-center gap-2">
                        {staff.name || "名前未設定"}
                        {!staff.is_active && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: "rgba(26,26,26,0.06)", color: "rgba(26,26,26,0.4)" }}
                          >
                            無効
                          </span>
                        )}
                      </p>
                      <p className="text-xs" style={{ color: "rgba(26,26,26,0.5)" }}>
                        {staff.title || ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 ml-13">
                    <span className="text-xs" style={{ color: "rgba(26,26,26,0.5)", fontFamily: "Inter" }}>
                      予約 {staff.totalBookings}件
                    </span>
                    <span className="text-xs" style={{ color: "#B8956A", fontFamily: "Inter" }}>
                      指名率 {staff.nominationRate}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 詳細・シフト */}
        <div className="flex-1 space-y-6">
          {!selectedStaff ? (
            <div
              className="rounded-lg px-6 py-12 text-center"
              style={{ backgroundColor: "#fff", border: "1px solid rgba(26,26,26,0.08)" }}
            >
              <p className="text-sm" style={{ color: "rgba(26,26,26,0.5)" }}>
                スタッフを選択してください
              </p>
            </div>
          ) : (
            <>
              {/* プロフィール */}
              <div
                className="rounded-lg p-5"
                style={{ backgroundColor: "#fff", border: "1px solid rgba(26,26,26,0.08)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-base font-medium"
                    style={{ fontFamily: "'Noto Serif JP', serif" }}
                  >
                    プロフィール
                  </h3>
                  <button
                    onClick={() => openEditProfile(selectedStaff)}
                    className="px-3 py-1.5 text-xs rounded-lg"
                    style={{ border: "1px solid rgba(26,26,26,0.12)", color: "#B8956A" }}
                  >
                    編集
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "rgba(26,26,26,0.5)" }}>名前</p>
                    <p className="text-sm">{selectedStaff.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "rgba(26,26,26,0.5)" }}>肩書き</p>
                    <p className="text-sm">{selectedStaff.title || "—"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs mb-0.5" style={{ color: "rgba(26,26,26,0.5)" }}>自己紹介</p>
                    <p className="text-sm">{selectedStaff.bio || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "rgba(26,26,26,0.5)" }}>専門分野</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(selectedStaff.specialties || []).map((s, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ backgroundColor: "rgba(184,149,106,0.1)", color: "#B8956A" }}
                        >
                          {s}
                        </span>
                      ))}
                      {(!selectedStaff.specialties || selectedStaff.specialties.length === 0) && (
                        <span className="text-xs" style={{ color: "rgba(26,26,26,0.4)" }}>—</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "rgba(26,26,26,0.5)" }}>ステータス</p>
                    <p className="text-sm">{selectedStaff.is_active ? "有効" : "無効"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 mt-4 pt-4 border-t" style={{ borderColor: "rgba(26,26,26,0.06)" }}>
                  <div>
                    <p className="text-xs" style={{ color: "rgba(26,26,26,0.5)" }}>予約数</p>
                    <p className="text-lg font-semibold" style={{ fontFamily: "Inter" }}>
                      {selectedStaff.totalBookings}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "rgba(26,26,26,0.5)" }}>指名率</p>
                    <p className="text-lg font-semibold" style={{ fontFamily: "Inter", color: "#B8956A" }}>
                      {selectedStaff.nominationRate}%
                    </p>
                  </div>
                </div>
              </div>

              {/* シフト設定 */}
              <div
                className="rounded-lg p-5"
                style={{ backgroundColor: "#fff", border: "1px solid rgba(26,26,26,0.08)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-base font-medium"
                    style={{ fontFamily: "'Noto Serif JP', serif" }}
                  >
                    シフト設定
                  </h3>
                  <button
                    onClick={saveSchedules}
                    disabled={saving}
                    className="px-4 py-1.5 text-xs rounded-lg disabled:opacity-50"
                    style={{ backgroundColor: "#1A1A1A", color: "#FAF6F1" }}
                  >
                    {saving ? "保存中..." : "シフトを保存"}
                  </button>
                </div>
                {scheduleLoading ? (
                  <p className="text-sm py-8 text-center" style={{ color: "rgba(26,26,26,0.5)" }}>読み込み中...</p>
                ) : (
                  <div className="space-y-2">
                    {schedules.map((schedule) => (
                      <div
                        key={schedule.day_of_week}
                        className="flex items-center gap-3 py-2 px-3 rounded-lg"
                        style={{
                          backgroundColor: schedule.is_available
                            ? "rgba(184,149,106,0.04)"
                            : "rgba(26,26,26,0.02)",
                        }}
                      >
                        <label className="flex items-center gap-2 w-20">
                          <input
                            type="checkbox"
                            checked={schedule.is_available}
                            onChange={(e) =>
                              updateSchedule(schedule.day_of_week, "is_available", e.target.checked)
                            }
                            className="rounded"
                          />
                          <span
                            className="text-sm font-medium"
                            style={{
                              color: schedule.is_available ? "#1A1A1A" : "rgba(26,26,26,0.4)",
                            }}
                          >
                            {DAY_LABELS[schedule.day_of_week]}
                          </span>
                        </label>
                        {schedule.is_available && (
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={schedule.start_time}
                              onChange={(e) =>
                                updateSchedule(schedule.day_of_week, "start_time", e.target.value)
                              }
                              className="px-2 py-1 text-sm rounded outline-none"
                              style={{
                                border: "1px solid rgba(26,26,26,0.1)",
                                backgroundColor: "#fff",
                                fontFamily: "Inter",
                              }}
                            />
                            <span className="text-xs" style={{ color: "rgba(26,26,26,0.5)" }}>
                              〜
                            </span>
                            <input
                              type="time"
                              value={schedule.end_time}
                              onChange={(e) =>
                                updateSchedule(schedule.day_of_week, "end_time", e.target.value)
                              }
                              className="px-2 py-1 text-sm rounded outline-none"
                              style={{
                                border: "1px solid rgba(26,26,26,0.1)",
                                backgroundColor: "#fff",
                                fontFamily: "Inter",
                              }}
                            />
                          </div>
                        )}
                        {!schedule.is_available && (
                          <span className="text-xs" style={{ color: "rgba(26,26,26,0.4)" }}>
                            休み
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* プロフィール編集モーダル */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowEditModal(false)} />
          <div
            className="relative z-10 w-full max-w-lg mx-4 rounded-lg p-6"
            style={{ backgroundColor: "#FAF6F1" }}
          >
            <h3
              className="text-base font-medium mb-5"
              style={{ fontFamily: "'Noto Serif JP', serif" }}
            >
              スタッフ情報編集
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: "rgba(26,26,26,0.6)" }}>名前</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ border: "1px solid rgba(26,26,26,0.12)", backgroundColor: "#fff" }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "rgba(26,26,26,0.6)" }}>肩書き</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ border: "1px solid rgba(26,26,26,0.12)", backgroundColor: "#fff" }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "rgba(26,26,26,0.6)" }}>自己紹介</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none"
                  style={{ border: "1px solid rgba(26,26,26,0.12)", backgroundColor: "#fff" }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "rgba(26,26,26,0.6)" }}>
                  専門分野（カンマ区切り）
                </label>
                <input
                  type="text"
                  value={editForm.specialties}
                  onChange={(e) => setEditForm({ ...editForm, specialties: e.target.value })}
                  placeholder="フェイシャル, アロマ, ヘッドスパ"
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ border: "1px solid rgba(26,26,26,0.12)", backgroundColor: "#fff" }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "rgba(26,26,26,0.6)" }}>画像URL</label>
                <input
                  type="text"
                  value={editForm.image_url}
                  onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ border: "1px solid rgba(26,26,26,0.12)", backgroundColor: "#fff" }}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  id="staff_active"
                  className="rounded"
                />
                <label htmlFor="staff_active" className="text-sm" style={{ color: "rgba(26,26,26,0.7)" }}>
                  有効にする
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm rounded-lg"
                style={{ border: "1px solid rgba(26,26,26,0.12)", color: "rgba(26,26,26,0.6)" }}
              >
                キャンセル
              </button>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="px-6 py-2 text-sm rounded-lg disabled:opacity-50"
                style={{ backgroundColor: "#1A1A1A", color: "#FAF6F1" }}
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
