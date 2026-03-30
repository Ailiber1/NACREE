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
    const { type, customerEmail, customerName, menuName, staffName, date, time, bookingNumber, amount } = body;

    const resendKey = env.RESEND_API_KEY;
    if (!resendKey || resendKey.includes("YOUR_")) {
      return new Response(
        JSON.stringify({ sent: false, reason: "Resend未設定" }),
        { headers: corsHeaders }
      );
    }

    let subject = "";
    let html = "";

    const headerHtml = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #FAF6F1;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 28px; color: #1A1A1A; letter-spacing: 0.15em; margin: 0;">NACRÉE</h1>
          <p style="color: #B8956A; font-size: 11px; letter-spacing: 0.2em; margin: 8px 0 0;">プライベートビューティーサロン</p>
        </div>
        <hr style="border: none; border-top: 1px solid #E8E0D8; margin: 0 0 30px;" />
    `;

    const footerHtml = `
        <hr style="border: none; border-top: 1px solid #E8E0D8; margin: 30px 0;" />
        <div style="text-align: center; color: #999; font-size: 11px; line-height: 1.8;">
          NACRÉE（ナクレ）<br>
          東京都港区南青山 x-x-x NACRÉEビル 3F<br>
          営業時間 10:00 - 20:00 / 不定休<br>
          03-xxxx-xxxx
        </div>
      </div>
    `;

    if (type === "confirmation") {
      subject = "【NACRÉE】ご予約を承りました";
      html = `${headerHtml}
        <h2 style="font-size: 18px; color: #1A1A1A; margin: 0 0 20px;">ご予約ありがとうございます</h2>
        <p style="color: #666; font-size: 14px; line-height: 1.8; margin: 0 0 25px;">
          ${customerName || "お客"}様、この度はNACRÉEをお選びいただきありがとうございます。<br>
          以下の内容でご予約を承りました。
        </p>
        <div style="background: #fff; border: 1px solid #E8E0D8; border-radius: 8px; padding: 24px; margin: 0 0 25px;">
          <table style="width: 100%; font-size: 14px; color: #1A1A1A;">
            <tr><td style="padding: 8px 0; color: #999; width: 100px;">予約番号</td><td style="padding: 8px 0; font-weight: 600; letter-spacing: 0.05em;">${bookingNumber || "-"}</td></tr>
            <tr><td style="padding: 8px 0; color: #999;">施術</td><td style="padding: 8px 0;">${menuName || "-"}</td></tr>
            <tr><td style="padding: 8px 0; color: #999;">担当</td><td style="padding: 8px 0;">${staffName || "指名なし"}</td></tr>
            <tr><td style="padding: 8px 0; color: #999;">日時</td><td style="padding: 8px 0;">${date || "-"} ${time || ""}</td></tr>
            ${amount ? `<tr><td style="padding: 8px 0; color: #999;">金額</td><td style="padding: 8px 0;">¥${Number(amount).toLocaleString()}</td></tr>` : ""}
          </table>
        </div>
        <p style="color: #666; font-size: 13px; line-height: 1.8;">
          ご来店を心よりお待ちしております。<br>
          キャンセル・変更はマイページからお手続きください。
        </p>
      ${footerHtml}`;
    } else if (type === "payment") {
      subject = "【NACRÉE】決済が完了しました";
      html = `${headerHtml}
        <h2 style="font-size: 18px; color: #1A1A1A; margin: 0 0 20px;">決済完了のお知らせ</h2>
        <p style="color: #666; font-size: 14px; line-height: 1.8; margin: 0 0 25px;">
          ${customerName || "お客"}様、事前決済が正常に完了いたしました。
        </p>
        <div style="background: #fff; border: 1px solid #E8E0D8; border-radius: 8px; padding: 24px; margin: 0 0 25px;">
          <table style="width: 100%; font-size: 14px; color: #1A1A1A;">
            <tr><td style="padding: 8px 0; color: #999; width: 100px;">予約番号</td><td style="padding: 8px 0; font-weight: 600;">${bookingNumber || "-"}</td></tr>
            <tr><td style="padding: 8px 0; color: #999;">施術</td><td style="padding: 8px 0;">${menuName || "-"}</td></tr>
            <tr><td style="padding: 8px 0; color: #999;">お支払い</td><td style="padding: 8px 0; font-weight: 600;">¥${Number(amount || 0).toLocaleString()}</td></tr>
          </table>
        </div>
        <p style="color: #666; font-size: 13px; line-height: 1.8;">
          ご来店を心よりお待ちしております。
        </p>
      ${footerHtml}`;
    }

    if (!subject) {
      return new Response(
        JSON.stringify({ sent: false, reason: "不明な通知タイプ" }),
        { headers: corsHeaders }
      );
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "NACRÉE <onboarding@resend.dev>",
        to: customerEmail,
        subject,
        html,
      }),
    });

    const result = await emailRes.json();

    if (!emailRes.ok) {
      return new Response(
        JSON.stringify({ sent: false, error: result }),
        { status: 400, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ sent: true, id: result.id }),
      { headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ sent: false, error: err.message }),
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
