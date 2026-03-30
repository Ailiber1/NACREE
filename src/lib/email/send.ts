import { getResend, isResendConfigured } from "./config";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(params: SendEmailParams): Promise<{
  success: boolean;
  message: string;
}> {
  if (!isResendConfigured()) {
    console.log("[Email Fallback] Resend未設定 — コンソールにログ出力");
    console.log(`  To: ${params.to}`);
    console.log(`  Subject: ${params.subject}`);
    console.log(`  Body: (HTML省略)`);
    return { success: true, message: "コンソールにログ出力しました（Resend未設定）" };
  }

  const resend = getResend();
  if (!resend) {
    return { success: false, message: "Resendの初期化に失敗しました" };
  }

  try {
    const { error } = await resend.emails.send({
      from: "NACREE <onboarding@resend.dev>",
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error("[Email Error]", error);
      return { success: false, message: error.message };
    }

    return { success: true, message: "メール送信完了" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "メール送信に失敗しました";
    console.error("[Email Error]", message);
    return { success: false, message };
  }
}
