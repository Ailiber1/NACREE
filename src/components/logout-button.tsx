"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="px-5 py-2 text-xs tracking-wider transition-colors"
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "4px",
        color: "var(--color-muted)",
      }}
    >
      ログアウト
    </button>
  );
}
