"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Menu } from "@/lib/supabase/types";

interface MenuForm {
  name: string;
  description: string;
  price: string;
  duration_min: string;
  image_url: string;
  is_active: boolean;
  sort_order: string;
}

const emptyForm: MenuForm = {
  name: "",
  description: "",
  price: "",
  duration_min: "",
  image_url: "",
  is_active: true,
  sort_order: "0",
};

export default function AdminMenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MenuForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchMenus = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("menus")
      .select("*")
      .order("sort_order");

    setMenus((data || []) as Menu[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  const openEdit = (menu: Menu) => {
    setEditingId(menu.id);
    setForm({
      name: menu.name,
      description: menu.description || "",
      price: String(menu.price),
      duration_min: String(menu.duration_min),
      image_url: menu.image_url || "",
      is_active: menu.is_active,
      sort_order: String(menu.sort_order),
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.duration_min) {
      setError("メニュー名、価格、所要時間は必須です");
      return;
    }

    setSaving(true);
    setError("");
    const supabase = createClient();

    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseInt(form.price, 10),
      duration_min: parseInt(form.duration_min, 10),
      image_url: form.image_url || null,
      is_active: form.is_active,
      sort_order: parseInt(form.sort_order, 10) || 0,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error: err } = await supabase
        .from("menus")
        .update(payload)
        .eq("id", editingId);
      if (err) {
        setError(`更新エラー: ${err.message}`);
        setSaving(false);
        return;
      }
    } else {
      const { error: err } = await supabase.from("menus").insert(payload);
      if (err) {
        setError(`作成エラー: ${err.message}`);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setShowModal(false);
    fetchMenus();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このメニューを削除しますか？")) return;
    const supabase = createClient();
    await supabase.from("menus").delete().eq("id", id);
    fetchMenus();
  };

  const toggleActive = async (menu: Menu) => {
    const supabase = createClient();
    await supabase
      .from("menus")
      .update({ is_active: !menu.is_active, updated_at: new Date().toISOString() })
      .eq("id", menu.id);
    fetchMenus();
  };

  const formatPrice = (n: number) => new Intl.NumberFormat("ja-JP").format(n);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2
          className="text-lg font-medium"
          style={{ fontFamily: "'Noto Serif JP', serif" }}
        >
          メニュー管理
        </h2>
        <button
          onClick={openCreate}
          className="px-4 py-2 text-sm rounded-lg transition-colors"
          style={{ backgroundColor: "#1A1A1A", color: "#FAF6F1" }}
        >
          + 新規メニュー
        </button>
      </div>

      {/* メニュー一覧 */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: "rgba(26,26,26,0.5)" }}>読み込み中...</p>
          </div>
        ) : menus.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: "rgba(26,26,26,0.5)" }}>メニューがありません</p>
          </div>
        ) : (
          menus.map((menu) => (
            <div
              key={menu.id}
              className="rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              style={{
                backgroundColor: "#fff",
                border: "1px solid rgba(26,26,26,0.08)",
                opacity: menu.is_active ? 1 : 0.6,
              }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">{menu.name}</h3>
                  {!menu.is_active && (
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: "rgba(26,26,26,0.06)",
                        color: "rgba(26,26,26,0.5)",
                      }}
                    >
                      非公開
                    </span>
                  )}
                </div>
                {menu.description && (
                  <p className="text-xs mt-1" style={{ color: "rgba(26,26,26,0.6)" }}>
                    {menu.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm font-medium" style={{ fontFamily: "Inter" }}>
                    ¥{formatPrice(menu.price)}
                  </span>
                  <span className="text-xs" style={{ color: "rgba(26,26,26,0.5)", fontFamily: "Inter" }}>
                    {menu.duration_min}分
                  </span>
                  <span className="text-xs" style={{ color: "rgba(26,26,26,0.4)", fontFamily: "Inter" }}>
                    表示順: {menu.sort_order}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(menu)}
                  className="px-3 py-1.5 text-xs rounded-lg transition-colors"
                  style={{
                    border: "1px solid rgba(26,26,26,0.12)",
                    color: "rgba(26,26,26,0.6)",
                  }}
                >
                  {menu.is_active ? "非公開にする" : "公開する"}
                </button>
                <button
                  onClick={() => openEdit(menu)}
                  className="px-3 py-1.5 text-xs rounded-lg transition-colors"
                  style={{
                    border: "1px solid rgba(26,26,26,0.12)",
                    color: "#B8956A",
                  }}
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(menu.id)}
                  className="px-3 py-1.5 text-xs rounded-lg transition-colors"
                  style={{
                    border: "1px solid rgba(199,80,80,0.3)",
                    color: "#C75050",
                  }}
                >
                  削除
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowModal(false)}
          />
          <div
            className="relative z-10 w-full max-w-lg mx-4 rounded-lg p-6"
            style={{ backgroundColor: "#FAF6F1" }}
          >
            <h3
              className="text-base font-medium mb-5"
              style={{ fontFamily: "'Noto Serif JP', serif" }}
            >
              {editingId ? "メニュー編集" : "新規メニュー"}
            </h3>

            {error && (
              <p className="text-xs mb-4 px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(199,80,80,0.1)", color: "#C75050" }}>
                {error}
              </p>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: "rgba(26,26,26,0.6)" }}>
                  メニュー名 *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ border: "1px solid rgba(26,26,26,0.12)", backgroundColor: "#fff" }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "rgba(26,26,26,0.6)" }}>
                  説明
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none"
                  style={{ border: "1px solid rgba(26,26,26,0.12)", backgroundColor: "#fff" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1" style={{ color: "rgba(26,26,26,0.6)" }}>
                    価格（税込）*
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                    style={{ border: "1px solid rgba(26,26,26,0.12)", backgroundColor: "#fff" }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "rgba(26,26,26,0.6)" }}>
                    所要時間（分）*
                  </label>
                  <input
                    type="number"
                    value={form.duration_min}
                    onChange={(e) => setForm({ ...form, duration_min: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                    style={{ border: "1px solid rgba(26,26,26,0.12)", backgroundColor: "#fff" }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1" style={{ color: "rgba(26,26,26,0.6)" }}>
                    画像URL
                  </label>
                  <input
                    type="text"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                    style={{ border: "1px solid rgba(26,26,26,0.12)", backgroundColor: "#fff" }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "rgba(26,26,26,0.6)" }}>
                    表示順
                  </label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                    style={{ border: "1px solid rgba(26,26,26,0.12)", backgroundColor: "#fff" }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  id="is_active"
                  className="rounded"
                />
                <label htmlFor="is_active" className="text-sm" style={{ color: "rgba(26,26,26,0.7)" }}>
                  公開する
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm rounded-lg"
                style={{ border: "1px solid rgba(26,26,26,0.12)", color: "rgba(26,26,26,0.6)" }}
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
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
