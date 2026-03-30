export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  try {
    const body = await request.json();
    const { bookingId, menuName, price, customerEmail } = body;

    const stripeSecretKey = env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey || stripeSecretKey.includes("YOUR_")) {
      return new Response(
        JSON.stringify({ mock: true, message: "Stripe未設定（モック決済）" }),
        { headers: corsHeaders }
      );
    }

    const appUrl = env.NEXT_PUBLIC_APP_URL || "https://nacree-salon.pages.dev";

    // Stripe Checkout Session作成（REST API直接呼び出し）
    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("payment_method_types[0]", "card");
    params.append("line_items[0][price_data][currency]", "jpy");
    params.append("line_items[0][price_data][product_data][name]", menuName || "施術メニュー");
    params.append("line_items[0][price_data][unit_amount]", String(price || 0));
    params.append("line_items[0][quantity]", "1");
    params.append("customer_email", customerEmail || "");
    params.append("success_url", `${appUrl}/book/complete?bn=${bookingId}&payment=success`);
    params.append("cancel_url", `${appUrl}/book/confirm?payment=cancelled`);
    params.append("metadata[booking_id]", bookingId || "");

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();

    if (session.error) {
      return new Response(
        JSON.stringify({ error: session.error.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "決済セッション作成に失敗しました" }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
