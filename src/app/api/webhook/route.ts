import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe/config";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";

// Webhook用にSupabaseサービスロールクライアントを使用
function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createServerClient(url, serviceKey, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  });
}

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe未設定" },
      { status: 400 }
    );
  }

  const stripe = getStripe()!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  const body = await request.text();
  const sig = request.headers.get("stripe-signature") || "";

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook署名検証失敗";
    console.error("[Webhook Error]", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const bookingId = session.metadata?.booking_id;

    if (bookingId) {
      const supabase = createServiceClient();

      const { error } = await supabase
        .from("booking_payments")
        .update({
          status: "completed",
        })
        .eq("stripe_session_id", session.id);

      if (error) {
        console.error("[Webhook DB Error]", error);
      } else {
        console.log(`[Webhook] 決済完了: booking_id=${bookingId}`);
      }
    }
  }

  return NextResponse.json({ received: true });
}
