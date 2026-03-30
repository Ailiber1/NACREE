"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BookingSteps } from "@/components/booking-steps";

interface StaffItem {
  id: string;
  name: string;
  title: string;
  specialty: string;
  image: string;
}

const DUMMY_STAFF: StaffItem[] = [
  {
    id: "staff-1",
    name: "田中 美咲",
    title: "チーフエステティシャン",
    specialty: "フェイシャルケア歴12年",
    image: "/images/staff-1.jpg",
  },
  {
    id: "staff-2",
    name: "佐藤 香織",
    title: "アロマセラピスト",
    specialty: "英国IFA認定資格保持",
    image: "/images/staff-2.jpg",
  },
  {
    id: "staff-3",
    name: "鈴木 優花",
    title: "エステティシャン",
    specialty: "敏感肌ケアのスペシャリスト",
    image: "/images/staff-3.jpg",
  },
];

export default function BookStaffPage() {
  const router = useRouter();
  const [menuInfo, setMenuInfo] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("booking_menu");
    if (!stored) {
      router.replace("/book");
      return;
    }
    setMenuInfo(JSON.parse(stored));
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {DUMMY_STAFF.map((staff) => (
          <button
            key={staff.id}
            onClick={() => selectStaff(staff)}
            className="text-center p-6 md:p-8 bg-white border border-[var(--color-border)] hover:border-[var(--color-antique-gold)] transition-colors group"
            style={{ borderRadius: "8px" }}
          >
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden mx-auto mb-4 border-2 border-transparent group-hover:border-[var(--color-antique-gold)] transition-colors">
              <Image
                src={staff.image}
                alt={staff.name}
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
            <p className="text-xs text-[var(--color-muted)]">{staff.specialty}</p>
          </button>
        ))}
      </div>

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
