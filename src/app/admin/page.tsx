import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: "var(--color-warm-ivory)",
          padding: "48px 24px",
        }}
      >
        <div className="text-center">
          <h1
            className="text-2xl font-semibold mb-4"
            style={{ fontFamily: "'Noto Serif JP', serif" }}
          >
            管理画面
          </h1>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            Supabaseが設定されていません。.env.local を設定後にアクセスしてください。
          </p>
        </div>
      </main>
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
    <main
      className="min-h-screen"
      style={{
        backgroundColor: "var(--color-warm-ivory)",
        padding: "48px 24px",
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <h1
            className="text-2xl font-semibold tracking-wide"
            style={{
              fontFamily: "'Noto Serif JP', serif",
              color: "var(--color-deep-charcoal)",
            }}
          >
            管理画面
          </h1>
          <LogoutButton />
        </div>
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          ようこそ、{profile.full_name || "管理者"}さん（{profile.role}）
        </p>
        <p className="text-sm mt-4" style={{ color: "var(--color-muted)" }}>
          Phase 2以降でダッシュボードを構築します。
        </p>
      </div>
    </main>
  );
}
