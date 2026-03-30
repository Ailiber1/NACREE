"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { BookingSteps } from "@/components/booking-steps";

interface StaffItem {
  id: string;
  name: string;
  title: string | null;
  specialties: string[] | null;
  image_url: string | null;
}

export default function BookStaffPage() {
  const router = useRouter();
  const [menuInfo, setMenuInfo] = useState<{ name: string } | null>(null);
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("booking_menu");
    if (!stored) {
      router.replace("/book");
      return;
    }
    setMenuInfo(JSON.parse(stored));

    async function fetchStaff() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("staff")
          .select("id, name, title, specialties, image_url")
          .eq("is_active", true);
        if (!error && data && data.length > 0) {
          setStaffList(data);
        }
      } catch {
        // fallback: empty list
      } finally {
        setLoading(false);
      }
    }
    fetchStaff();
  }, [router]);

  function selectStaff(staff: StaffItem) {
    sessionStorage.setItem(
      "booking_staff",
      JSON.stringify({ id: staff.id, name: staff.name })
    );
    router.push("/book/calendar");
  }

  if (!menuInfo) return null;

  return (
    <>
      <BookingSteps current={2} />
      <h1
        className="text-xl md:text-2xl font-medium tracking-[0.1em] text-center mb-3"
        style={{ fontFamily: "'Noto Serif JP', serif" }}
      >
        スタッフを選択
      </h1>
      <p className="text-center text-sm text-[var(--color-muted)] mb-10">
        {menuInfo.name} — 担当スタッフをお選びください
      </p>

      {loading ? (
        <div className="text-center py-20 text-[var(--color-muted)] text-sm">読み込み中...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {staffList.map((staff) => (
            <button
              key={staff.id}
              onClick={() => selectStaff(staff)}
              className="text-center p-6 md:p-8 bg-white border border-[var(--color-border)] hover:border-[var(--color-antique-gold)] transition-colors group"
              style={{ borderRadius: "8px" }}
            >
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden mx-auto mb-4 border-2 border-transparent group-hover:border-[var(--color-antique-gold)] transition-colors">
                <Image
                  src={staff.image_url || "/images/staff-1.jpg"}
                  alt={staff.name || "スタッフ"}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
              <p
                className="font-medium tracking-wide mb-1 group-hover:text-[var(--color-antique-gold)] transition-colors"
                style={{ fontFamily: "'Noto Serif JP', serif" }}
              >
                {staff.name}
              </p>
              <p className="text-xs text-[var(--color-muted)] mb-1">{staff.title}</p>
              <p className="text-xs text-[var(--color-muted)]">
                {staff.specialties ? staff.specialties.join("・") : ""}
              </p>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => {
          sessionStorage.setItem(
            "booking_staff",
            JSON.stringify({ id: "any", name: "指名なし" })
          );
          router.push("/book/calendar");
        }}
        className="block mx-auto mt-6 text-sm text-[var(--color-muted)] hover:text-[var(--color-deep-charcoal)] transition-colors underline underline-offset-4"
      >
        指名なしで予約する
      </button>
    </>
  );
}
