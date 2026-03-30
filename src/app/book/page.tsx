"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { BookingSteps } from "@/components/booking-steps";
import type { Menu } from "@/lib/supabase/types";

const FALLBACK_MENUS: Menu[] = [
  {
    id: "1",
    name: "フェイシャルトリートメント",
    description: "肌の奥深くに潤いを届け、毛穴ほこりや古い角質を丁寧に除去するフェイシャルケア。",
    price: 18000,
    duration_min: 60,
    image_url: "/images/menu-facial.jpg",
    is_active: true,
    sort_order: 1,
    created_at: "",
    updated_at: "",
  },
  {
    id: "2",
    name: "アロマボディケア",
    description: "お客様の体調に合わせた精油をブレンド。心身の疲れをほぐす至上のボディトリートメント。",
    price: 24000,
    duration_min: 90,
    image_url: "/images/menu-body.jpg",
    is_active: true,
    sort_order: 2,
    created_at: "",
    updated_at: "",
  },
  {
    id: "3",
    name: "プレミアムコース",
    description: "フェイシャルからボディまで、厳選された施術を組み合わせたトータルビューティーコース。",
    price: 38000,
    duration_min: 120,
    image_url: "/images/menu-premium.jpg",
    is_active: true,
    sort_order: 3,
    created_at: "",
    updated_at: "",
  },
];

export default function BookMenuPage() {
  const router = useRouter();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMenus() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("menus")
          .select("*")
          .eq("is_active", true)
          .order("sort_order");
        if (error || !data || data.length === 0) {
          setMenus(FALLBACK_MENUS);
        } else {
          setMenus(data);
        }
      } catch {
        setMenus(FALLBACK_MENUS);
      } finally {
        setLoading(false);
      }
    }
    fetchMenus();
  }, []);

  function selectMenu(menu: Menu) {
    sessionStorage.setItem(
      "booking_menu",
      JSON.stringify({ id: menu.id, name: menu.name, price: menu.price, duration_min: menu.duration_min })
    );
    router.push("/book/staff");
  }

  return (
    <>
      <BookingSteps current={1} />
      <h1
        className="text-xl md:text-2xl font-medium tracking-[0.1em] text-center mb-3"
        style={{ fontFamily: "'Noto Serif JP', serif" }}
      >
        メニューを選択
      </h1>
      <p className="text-center text-sm text-[var(--color-muted)] mb-10">
        ご希望の施術メニューをお選びください
      </p>

      {loading ? (
        <div className="text-center py-20 text-[var(--color-muted)] text-sm">読み込み中...</div>
      ) : (
        <div className="space-y-4">
          {menus.map((menu) => (
            <button
              key={menu.id}
              onClick={() => selectMenu(menu)}
              className="w-full text-left flex gap-4 md:gap-6 p-4 md:p-6 bg-white border border-[var(--color-border)] hover:border-[var(--color-antique-gold)] transition-colors group"
              style={{ borderRadius: "8px" }}
            >
              <div className="w-20 h-20 md:w-28 md:h-28 flex-shrink-0 relative overflow-hidden" style={{ borderRadius: "4px" }}>
                <Image
                  src={menu.image_url || "/images/menu-facial.jpg"}
                  alt={menu.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className="text-base md:text-lg font-medium tracking-wide mb-1 group-hover:text-[var(--color-antique-gold)] transition-colors"
                  style={{ fontFamily: "'Noto Serif JP', serif" }}
                >
                  {menu.name}
                </h3>
                <p className="text-xs md:text-sm text-[var(--color-muted)] mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {menu.duration_min}min / ¥{menu.price.toLocaleString()}
                </p>
                <p className="text-xs md:text-sm text-[var(--color-muted)] leading-relaxed line-clamp-2">
                  {menu.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
