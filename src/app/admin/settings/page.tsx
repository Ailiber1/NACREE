"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface DayHours {
  open: string;
  close: string;
}

interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

interface Holiday {
  date: string;
  reason: string;
}

interface NotificationSettings {
  email_confirmation: boolean;
  email_reminder: boolean;
  reminder_hours_before: number;
}

interface BusinessSettings {
  id: string;
  business_hours: BusinessHours;
  holidays: Holiday[];
  cancel_policy_hours: number;
  notification_settings: NotificationSettings;
}

const DAY_KEYS: (keyof BusinessHours)[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
const DAY_NAMES: Record<string, string> = {
  sunday: "日曜日",
  monday: "月曜日",
  tuesday: "火曜日",
  wednesday: "水曜日",
  thursday: "木曜日",
  friday: "金曜日",
  saturday: "土曜日",
};

// 定休日として扱う曜日（UIで「休業」チェックボックスの管理用）
const CLOSED_MARKER = "00:00";

const DEFAULT_SETTINGS: BusinessSettings = {
  id: "",
  business_hours: {
    sunday: { open: CLOSED_MARKER, close: CLOSED_MARKER },
    monday: { open: "10:00", close: "20:00" },
    tuesday: { open: "10:00", close: "20:00" },
    wednesday: { open: "10:00", close: "20:00" },
    thursday: { open: "10:00", close: "20:00" },
    friday: { open: "10:00", close: "20:00" },
    saturday: { open: "10:00", close: "20:00" },
  },
  holidays: [],
  cancel_policy_hours: 24,
  notification_settings: {
    email_confirmation: true,
    email_reminder: true,
    reminder_hours_before: 24,
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [closedDays, setClosedDays] = useState<Set<string>>(new Set(["sunday"]));
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayReason, setNewHolidayReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchSettings = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("business_settings")
      .select("*")
      .limit(1)
      .single();

    if (data) {
      setSettings(data as BusinessSettings);
      // 定休日を判定（open === close === "00:00"の曜日）
      const closed = new Set<string>();
      const bh = data.business_hours as BusinessHours;
      for (const key of DAY_KEYS) {
        if (bh[key].open === CLOSED_MARKER && bh[key].close === CLOSED_MARKER) {
          closed.add(key);
        }
      }
      setClosedDays(closed);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function saveSettings() {
    setSaving(true);
    setMessage(null);
    const supabase = createClient();

    try {
      // 定休日を営業時間に反映
      const updatedHours = { ...settings.business_hours };
      for (const key of DAY_KEYS) {
        if (closedDays.has(key)) {
          updatedHours[key] = { open: CLOSED_MARKER, close: CLOSED_MARKER };
        }
      }

      const updatePayload = {
        business_hours: updatedHours,
        holidays: settings.holidays,
        cancel_policy_hours: settings.cancel_policy_hours,
        notification_settings: settings.notification_settings,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("business_settings")
        .update(updatePayload)
        .eq("id", settings.id);

      if (error) throw error;
      setMessage({ type: "success", text: "設��を保存し��した" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "保存に失敗しました";
      setMessage({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  }

  function updateHour(
    day: keyof BusinessHours,
    field: "open" | "close",
    value: string
  ) {
    setSettings((prev) => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: { ...prev.business_hours[day], [field]: value },
      },
    }));
  }

  function toggleClosed(day: string) {
    setClosedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
        // 定休日解除時にデフォルトの営業時間を復元
        setSettings((s) => ({
          ...s,
          business_hours: {
            ...s.business_hours,
            [day]: { open: "10:00", close: "20:00" },
          },
        }));
      } else {
        next.add(day);
      }
      return next;
    });
  }

  function addHoliday() {
    if (!newHolidayDate) return;
    setSettings((prev) => ({
      ...prev,
      holidays: [
        ...prev.holidays,
        { date: newHolidayDate, reason: newHolidayReason || "休業日" },
      ],
    }));
    setNewHolidayDate("");
    setNewHolidayReason("");
  }

  function removeHoliday(index: number) {
    setSettings((prev) => ({
      ...prev,
      holidays: prev.holidays.filter((_, i) => i !== index),
    }));
  }

  function updateNotification(
    field: keyof NotificationSettings,
    value: boolean | number
  ) {
    setSettings((prev) => ({
      ...prev,
      notification_settings: {
        ...prev.notification_settings,
        [field]: value,
      },
    }));
  }

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
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1
          className="text-xl font-medium"
          style={{ fontFamily: "'Noto Serif JP', serif" }}
        >
          設定
        </h1>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-5 py-2.5 text-sm tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{
            backgroundColor: "var(--color-antique-gold)",
            borderRadius: "6px",
          }}
        >
          {saving ? "保存中..." : "設定を保存"}
        </button>
      </div>

      {message && (
        <div
          className="p-3 text-sm"
          style={{
            borderRadius: "6px",
            backgroundColor:
              message.type === "success"
                ? "rgba(143,169,143,0.1)"
                : "rgba(199,80,80,0.1)",
            color: message.type === "success" ? "#5C8C5C" : "#C75050",
            border: `1px solid ${
              message.type === "success"
                ? "rgba(143,169,143,0.3)"
                : "rgba(199,80,80,0.3)"
            }`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* 営業時間設定 */}
      <section
        className="rounded-lg p-6"
        style={{
          backgroundColor: "#fff",
          border: "1px solid rgba(26,26,26,0.08)",
        }}
      >
        <h2
          className="text-base font-medium mb-5"
          style={{ fontFamily: "'Noto Serif JP', serif" }}
        >
          営業時間
        </h2>
        <div className="space-y-3">
          {DAY_KEYS.map((day) => {
            const isClosed = closedDays.has(day);
            return (
              <div key={day} className="flex items-center gap-3 flex-wrap">
                <span
                  className="w-16 text-sm flex-shrink-0"
                  style={{
                    color: isClosed
                      ? "rgba(26,26,26,0.3)"
                      : "rgba(26,26,26,0.8)",
                  }}
                >
                  {DAY_NAMES[day]}
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isClosed}
                    onChange={() => toggleClosed(day)}
                    className="w-4 h-4 accent-[#B8956A]"
                  />
                  <span
                    className="text-xs"
                    style={{ color: "rgba(26,26,26,0.5)" }}
                  >
                    休業
                  </span>
                </label>
                {!isClosed && (
                  <>
                    <input
                      type="time"
                      value={settings.business_hours[day].open}
                      onChange={(e) => updateHour(day, "open", e.target.value)}
                      className="px-2.5 py-1.5 text-sm border bg-white"
                      style={{
                        borderColor: "var(--color-border)",
                        borderRadius: "4px",
                        fontFamily: "Inter",
                      }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: "rgba(26,26,26,0.4)" }}
                    >
                      ~
                    </span>
                    <input
                      type="time"
                      value={settings.business_hours[day].close}
                      onChange={(e) => updateHour(day, "close", e.target.value)}
                      className="px-2.5 py-1.5 text-sm border bg-white"
                      style={{
                        borderColor: "var(--color-border)",
                        borderRadius: "4px",
                        fontFamily: "Inter",
                      }}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 休業日設定 */}
      <section
        className="rounded-lg p-6"
        style={{
          backgroundColor: "#fff",
          border: "1px solid rgba(26,26,26,0.08)",
        }}
      >
        <h2
          className="text-base font-medium mb-5"
          style={{ fontFamily: "'Noto Serif JP', serif" }}
        >
          休業日（臨時）
        </h2>
        <div className="flex items-end gap-3 flex-wrap mb-4">
          <div>
            <label
              className="block text-xs mb-1"
              style={{ color: "rgba(26,26,26,0.5)" }}
            >
              日付
            </label>
            <input
              type="date"
              value={newHolidayDate}
              onChange={(e) => setNewHolidayDate(e.target.value)}
              className="px-3 py-2 text-sm border bg-white"
              style={{
                borderColor: "var(--color-border)",
                borderRadius: "4px",
                fontFamily: "Inter",
              }}
            />
          </div>
          <div>
            <label
              className="block text-xs mb-1"
              style={{ color: "rgba(26,26,26,0.5)" }}
            >
              理由
            </label>
            <input
              type="text"
              value={newHolidayReason}
              onChange={(e) => setNewHolidayReason(e.target.value)}
              placeholder="例: 年末年始休業"
              className="px-3 py-2 text-sm border bg-white w-48"
              style={{
                borderColor: "var(--color-border)",
                borderRadius: "4px",
              }}
            />
          </div>
          <button
            onClick={addHoliday}
            disabled={!newHolidayDate}
            className="px-4 py-2 text-sm border transition-colors hover:bg-[rgba(26,26,26,0.03)] disabled:opacity-40"
            style={{
              borderColor: "var(--color-border)",
              borderRadius: "4px",
            }}
          >
            追加
          </button>
        </div>
        {settings.holidays.length === 0 ? (
          <p
            className="text-sm py-4"
            style={{ color: "rgba(26,26,26,0.4)" }}
          >
            臨時休業日は設定されていません
          </p>
        ) : (
          <div className="space-y-2">
            {settings.holidays
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((day, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded"
                  style={{ backgroundColor: "rgba(26,26,26,0.02)" }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm" style={{ fontFamily: "Inter" }}>
                      {day.date.replace(/-/g, "/")}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "rgba(26,26,26,0.5)" }}
                    >
                      {day.reason}
                    </span>
                  </div>
                  <button
                    onClick={() => removeHoliday(i)}
                    className="text-xs px-2 py-1 hover:bg-red-50 hover:text-red-500 transition-colors rounded"
                    style={{ color: "rgba(26,26,26,0.4)" }}
                  >
                    削除
                  </button>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* キャンセルポリシー */}
      <section
        className="rounded-lg p-6"
        style={{
          backgroundColor: "#fff",
          border: "1px solid rgba(26,26,26,0.08)",
        }}
      >
        <h2
          className="text-base font-medium mb-5"
          style={{ fontFamily: "'Noto Serif JP', serif" }}
        >
          キャンセルポリシー
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm">予約の</span>
          <input
            type="number"
            min="1"
            max="168"
            value={settings.cancel_policy_hours}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                cancel_policy_hours: parseInt(e.target.value, 10) || 24,
              }))
            }
            className="w-20 px-2.5 py-1.5 text-sm border bg-white text-center"
            style={{
              borderColor: "var(--color-border)",
              borderRadius: "4px",
              fontFamily: "Inter",
            }}
          />
          <span className="text-sm">時間前まで無料キャンセル可</span>
        </div>
      </section>

      {/* 通知設定 */}
      <section
        className="rounded-lg p-6"
        style={{
          backgroundColor: "#fff",
          border: "1px solid rgba(26,26,26,0.08)",
        }}
      >
        <h2
          className="text-base font-medium mb-5"
          style={{ fontFamily: "'Noto Serif JP', serif" }}
        >
          通知設定
        </h2>
        <div className="space-y-4">
          <ToggleRow
            label="予約確定メール"
            description="予約確定時にお客様にメールを送信"
            checked={settings.notification_settings.email_confirmation}
            onChange={(v) => updateNotification("email_confirmation", v)}
          />

          <div
            className="border-t"
            style={{ borderColor: "rgba(26,26,26,0.06)" }}
          />

          <ToggleRow
            label="リマインダーメール"
            description="予約前にリマインダーメールを送信"
            checked={settings.notification_settings.email_reminder}
            onChange={(v) => updateNotification("email_reminder", v)}
          />

          {settings.notification_settings.email_reminder && (
            <div className="flex items-center gap-3 ml-4">
              <span
                className="text-xs"
                style={{ color: "rgba(26,26,26,0.5)" }}
              >
                予約の
              </span>
              <input
                type="number"
                min="1"
                max="72"
                value={settings.notification_settings.reminder_hours_before}
                onChange={(e) =>
                  updateNotification(
                    "reminder_hours_before",
                    parseInt(e.target.value, 10) || 24
                  )
                }
                className="w-16 px-2 py-1 text-xs border bg-white text-center"
                style={{
                  borderColor: "var(--color-border)",
                  borderRadius: "4px",
                  fontFamily: "Inter",
                }}
              />
              <span
                className="text-xs"
                style={{ color: "rgba(26,26,26,0.5)" }}
              >
                時間前に送信
              </span>
            </div>
          )}
        </div>

        <div
          className="mt-5 p-3"
          style={{
            backgroundColor: "rgba(184,149,106,0.06)",
            borderRadius: "6px",
          }}
        >
          <p
            className="text-xs"
            style={{ color: "rgba(26,26,26,0.5)" }}
          >
            メール送信にはResend APIキーの設定が必要です。未設定の場合、コンソールにログ出力されます。
          </p>
        </div>
      </section>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className="flex items-center justify-between cursor-pointer"
      onClick={() => onChange(!checked)}
    >
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs mt-0.5" style={{ color: "rgba(26,26,26,0.5)" }}>
          {description}
        </p>
      </div>
      <div className="relative flex-shrink-0">
        <div
          className="w-11 h-6 rounded-full transition-colors"
          style={{
            backgroundColor: checked ? "#B8956A" : "rgba(26,26,26,0.15)",
          }}
        >
          <div
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
            style={{
              transform: checked ? "translateX(22px)" : "translateX(2px)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
