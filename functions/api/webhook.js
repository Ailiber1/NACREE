export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    // Webhook署名検証（S-21）
    // 本番ではSTRIPE_WEBHOOK_SECRETを設定して署名を検証する
    // テストモードでは簡易的にイベントをパース
    let event;
    try {
      event = JSON.parse(body);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const bookingId = session.metadata?.booking_id;
      const customerEmail = session.customer_email;

      // Supabaseでbooking_paymentsを更新
      const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && serviceRoleKey && bookingId) {
        // 冪等性チェック（S-23）: 既にpaidならスキップ
        const checkRes = await fetch(
          `${supabaseUrl}/rest/v1/booking_payments?booking_id=eq.${bookingId}&status=eq.paid`,
          {
            headers: {
              "apikey": serviceRoleKey,
              "Authorization": `Bearer ${serviceRoleKey}`,
            },
          }
        );
        const existing = await checkRes.json();
        if (existing && existing.length > 0) {
          return new Response(JSON.stringify({ received: true, skipped: true }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        // booking_paymentsを更新
        await fetch(
          `${supabaseUrl}/rest/v1/booking_payments?booking_id=eq.${bookingId}`,
          {
            method: "PATCH",
            headers: {
              "apikey": serviceRoleKey,
              "Authorization": `Bearer ${serviceRoleKey}`,
              "Content-Type": "application/json",
              "Prefer": "return=minimal",
            },
            body: JSON.stringify({
              status: "paid",
              stripe_session_id: session.id,
            }),
          }
        );
      }

      // メール通知送信
      const resendKey = env.RESEND_API_KEY;
      if (resendKey && !resendKey.includes("YOUR_") && customerEmail) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "NACRÉE <onboarding@resend.dev>",
            to: customerEmail,
            subject: "【NACRÉE】決済完了のお知らせ",
            html: `
              <div style="font-family: 'Noto Sans JP', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <h1 style="font-size: 24px; color: #1A1A1A; text-align: center; letter-spacing: 0.1em;">NACRÉE</h1>
                <p style="text-align: center; color: #B8956A; font-size: 12px; letter-spacing: 0.2em;">ナクレ プライベートビューティーサロン</p>
                <hr style="border: none; border-top: 1px solid #E8E0D8; margin: 30px 0;" />
                <h2 style="font-size: 18px; color: #1A1A1A;">決済が完了しました</h2>
                <p style="color: #666; line-height: 1.8;">
                  ご予約の事前決済が正常に完了いたしました。<br>
                  ご来店を心よりお待ちしております。
                </p>
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                  お支払い金額: ¥${(session.amount_total || 0).toLocaleString()}<br>
                  予約番号: ${bookingId || "N/A"}
                </p>
                <hr style="border: none; border-top: 1px solid #E8E0D8; margin: 30px 0;" />
                <p style="color: #999; font-size: 12px; text-align: center;">
                  NACRÉE（ナクレ）<br>
                  東京都港区南青山 x-x-x NACRÉEビル 3F<br>
                  03-xxxx-xxxx
                </p>
              </div>
            `,
          }),
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
