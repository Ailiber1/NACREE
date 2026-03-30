import { NextRequest, NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe/config";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookingId, menuName, price, customerEmail } = body;

    if (!isStripeConfigured()) {
      // Stripe未設定: モック決済としてbooking_paymentsを直接更新
      const { error: paymentError } = await supabase
        .from("booking_payments")
        .upsert({
          booking_id: bookingId,
          amount: price,
          currency: "jpy",
          status: "completed",
          stripe_session_id: `mock_${Date.now()}`,
        }, { onConflict: "booking_id" });

      if (paymentError) {
        console.error("booking_payments更新エラー:", paymentError);
      }

      return NextResponse.json({
        mock: true,
        message: "Stripe未設定のため、モック決済を完了しました",
        bookingId,
      });
    }

    const stripe = getStripe()!;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: menuName || "施術メニュー",
              description: "NACREE Beauty Salon",
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${appUrl}/book/complete?bn=${bookingId}&payment=success`,
      cancel_url: `${appUrl}/book/confirm?payment=cancelled`,
      customer_email: customerEmail,
      metadata: {
        booking_id: bookingId,
      },
    });

    // booking_paymentsにpending状態で記録
    await supabase.from("booking_payments").upsert({
      booking_id: bookingId,
      amount: price,
      currency: "jpy",
      status: "pending",
      stripe_session_id: session.id,
    }, { onConflict: "booking_id" });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "決済エラー";
    console.error("[Checkout Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
