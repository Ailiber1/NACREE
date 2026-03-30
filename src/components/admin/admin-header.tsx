"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AdminHeaderProps {
  title: string;
  userName?: string;
}

export function AdminHeader({ title, userName }: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <header
      className="flex items-center justify-between px-6 py-4 border-b lg:px-8"
      style={{ borderColor: "var(--color-border)", backgroundColor: "#FAF6F1" }}
    >
      <div className="pl-12 lg:pl-0">
        <h1
          className="text-xl font-semibold tracking-wide"
          style={{ fontFamily: "'Noto Serif JP', serif", color: "#1A1A1A" }}
        >
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        {userName && (
          <span className="text-sm hidden sm:inline" style={{ color: "rgba(26,26,26,0.6)" }}>
            {userName}
          </span>
        )}
        <button
          onClick={handleLogout}
          className="px-4 py-1.5 text-xs tracking-wider rounded transition-colors"
          style={{
            border: "1px solid rgba(26,26,26,0.15)",
            color: "rgba(26,26,26,0.6)",
          }}
        >
          ログアウト
        </button>
      </div>
    </header>
  );
}
