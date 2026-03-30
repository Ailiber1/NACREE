"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthConfirmPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      try {
        const supabase = createClient();
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const next = params.get("next") || "/";

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            router.replace(next);
            return;
          }
        }

        // Handle hash fragment for implicit flow
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        if (accessToken) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            router.replace(next);
            return;
          }
        }

        router.replace("/auth/login?error=callback_failed");
      } catch {
        router.replace("/auth/login?error=callback_failed");
      }
    }
    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FAF6F1" }}>
      <p className="text-sm" style={{ color: "rgba(26,26,26,0.5)" }}>
        認証処理中...
      </p>
    </div>
  );
}
