import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import {
  bookingConfirmationEmail,
  bookingReminderEmail,
  bookingCancellationEmail,
} from "@/lib/email/templates";

export const runtime = "nodejs";

type NotificationType = "confirmation" | "reminder" | "cancellation";

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
    const {
      type,
      bookingId,
      customerEmail,
      customerName,
      menuName,
      staffName,
      date,
      time,
      price,
      bookingNumber,
    } = body as {
      type: NotificationType;
      bookingId?: string;
      customerEmail: string;
      customerName: string;
      menuName: string;
      staffName: string;
      date: string;
      time: string;
      price: number;
      bookingNumber?: string;
    };

    // business_settingsから通知設定を確認
    const { data: settings } = await supabase
      .from("business_settings")
      .select("notification_settings")
      .limit(1)
      .single();

    const notifSettings = settings?.notification_settings as {
      email_confirmation?: boolean;
      email_reminder?: boolean;
    } | null;

    // タイプに応じた通知設定チェック
    if (type === "confirmation" && notifSettings?.email_confirmation === false) {
      return NextResponse.json({
        success: true,
        message: "予約確定メールがOFFに設定されています",
        skipped: true,
      });
    }
    if (type === "reminder" && notifSettings?.email_reminder === false) {
      return NextResponse.json({
        success: true,
        message: "リマインダーメールがOFFに設定されています",
        skipped: true,
      });
    }

    const info = {
      customerName,
      menuName,
      staffName,
      date,
      time,
      price,
      bookingNumber,
    };

    let emailContent;
    switch (type) {
      case "confirmation":
        emailContent = bookingConfirmationEmail(info);
        break;
      case "reminder":
        emailContent = bookingReminderEmail(info);
        break;
      case "cancellation":
        emailContent = bookingCancellationEmail(info);
        break;
      default:
        return NextResponse.json(
          { error: "不正な通知タイプ" },
          { status: 400 }
        );
    }

    const result = await sendEmail({
      to: customerEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log(
      `[Notification] type=${type} booking=${bookingId || "N/A"} to=${customerEmail} success=${result.success}`
    );

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "通知エラー";
    console.error("[Notification Error]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
