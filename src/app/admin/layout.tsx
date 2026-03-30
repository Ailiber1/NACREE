"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("管理者");
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login?redirect=/admin");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profile || (profile.role !== "admin" && profile.role !== "staff")) {
        router.replace("/");
        return;
      }

      setUserName(profile.full_name || "管理者");
      setAuthorized(true);
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FAF6F1" }}>
        <p className="text-sm" style={{ color: "rgba(26,26,26,0.6)" }}>
          Supabaseが設定されていません。
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FAF6F1" }}>
        <p className="text-sm" style={{ color: "rgba(26,26,26,0.5)" }}>
          読み込み中...
        </p>
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAF6F1" }}>
      <AdminSidebar />
      <div className="lg:ml-64">
        <AdminHeader title="NACRÉE" userName={userName} />
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
