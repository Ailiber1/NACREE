import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY || "";

export function isResendConfigured(): boolean {
  return resendApiKey !== "" && !resendApiKey.startsWith("re_YOUR");
}

let resendInstance: Resend | null = null;

export function getResend(): Resend | null {
  if (!isResendConfigured()) return null;
  if (!resendInstance) {
    resendInstance = new Resend(resendApiKey);
  }
  return resendInstance;
}
