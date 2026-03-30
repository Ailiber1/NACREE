/**
 * Stripe Webhook ハンドラー（本番SSR移行時に使用）
 *
 * セキュリティ項目:
 * - S-21: Webhook署名検証（stripe.webhooks.constructEvent）
 * - S-23: 冪等性（stripe_session_idの重複チェック）
 *
 * 静的エクスポート（Cloudflare Pages）では動作しません。
 * Next.js SSR + Cloudflare Workers 移行時に /api/webhook/route.ts で使用してください。
 */

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
});

export async function handleWebhook(
  body: string,
  signature: string
): Promise<{ success: boolean; error?: string }> {
  // S-21: Webhook署名検証
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err) {
    return { success: false, error: "Webhook signature verification failed" };
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const sessionId = session.id;

    // S-23: 冪等性 — 同一session_idの重複処理防止
    // Supabase service_role で booking_payments を確認
    // 既にpaid状態であればスキップ
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    const { data: existing } = await supabase
      .from("booking_payments")
      .select("id, status")
      .eq("stripe_session_id", sessionId)
      .single();

    if (existing?.status === "paid") {
      // 既に処理済み — 冪等性チェックでスキップ
      return { success: true };
    }

    // booking_payments を更新
    await supabase
      .from("booking_payments")
      .update({ status: "paid", stripe_session_id: sessionId })
      .eq("stripe_session_id", sessionId);
  }

  return { success: true };
}
