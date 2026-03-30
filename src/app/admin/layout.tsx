import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FAF6F1" }}>
        <p className="text-sm" style={{ color: "rgba(26,26,26,0.6)" }}>
          Supabaseが設定されていません。
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "staff")) {
    redirect("/");
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAF6F1" }}>
      <AdminSidebar />
      <div className="lg:ml-64">
        <AdminHeader title="NACRÉE" userName={profile.full_name || "管理者"} />
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
