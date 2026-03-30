interface BookingInfo {
  customerName: string;
  menuName: string;
  staffName: string;
  date: string;
  time: string;
  price: number;
  bookingNumber?: string;
}

export function bookingConfirmationEmail(info: BookingInfo): {
  subject: string;
  html: string;
} {
  return {
    subject: `【NACREE】ご予約確定のお知らせ`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:'Helvetica Neue',Arial,sans-serif;color:#1A1A1A;">
        <div style="padding:32px 24px;background:#FAF6F1;text-align:center;">
          <h1 style="font-size:20px;letter-spacing:0.2em;color:#B8956A;margin:0;">NACREE</h1>
        </div>
        <div style="padding:32px 24px;">
          <p style="font-size:14px;line-height:1.8;">
            ${info.customerName} 様<br><br>
            ご予約ありがとうございます。以下の内容で予約が確定いたしました。
          </p>
          <div style="margin:24px 0;padding:20px;background:#FAF6F1;border-radius:8px;">
            ${info.bookingNumber ? `<p style="font-size:12px;color:rgba(26,26,26,0.6);margin:0 0 4px;">予約番号</p><p style="font-size:16px;font-weight:600;margin:0 0 16px;">${info.bookingNumber}</p>` : ""}
            <p style="font-size:12px;color:rgba(26,26,26,0.6);margin:0 0 4px;">施術メニュー</p>
            <p style="font-size:14px;margin:0 0 12px;">${info.menuName}</p>
            <p style="font-size:12px;color:rgba(26,26,26,0.6);margin:0 0 4px;">担当スタッフ</p>
            <p style="font-size:14px;margin:0 0 12px;">${info.staffName}</p>
            <p style="font-size:12px;color:rgba(26,26,26,0.6);margin:0 0 4px;">日時</p>
            <p style="font-size:14px;margin:0 0 12px;">${info.date} ${info.time}</p>
            <p style="font-size:12px;color:rgba(26,26,26,0.6);margin:0 0 4px;">料金</p>
            <p style="font-size:14px;margin:0;">&yen;${info.price.toLocaleString()}</p>
          </div>
          <p style="font-size:13px;color:rgba(26,26,26,0.6);line-height:1.8;">
            ご不明点がございましたら、お気軽にお問い合わせください。<br>
            ご来店を心よりお待ちしております。
          </p>
        </div>
        <div style="padding:16px 24px;background:#1A1A1A;text-align:center;">
          <p style="font-size:11px;color:rgba(255,255,255,0.4);margin:0;">NACREE Beauty Salon</p>
        </div>
      </div>
    `,
  };
}

export function bookingReminderEmail(info: BookingInfo): {
  subject: string;
  html: string;
} {
  return {
    subject: `【NACREE】明日のご予約リマインダー`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:'Helvetica Neue',Arial,sans-serif;color:#1A1A1A;">
        <div style="padding:32px 24px;background:#FAF6F1;text-align:center;">
          <h1 style="font-size:20px;letter-spacing:0.2em;color:#B8956A;margin:0;">NACREE</h1>
        </div>
        <div style="padding:32px 24px;">
          <p style="font-size:14px;line-height:1.8;">
            ${info.customerName} 様<br><br>
            明日のご予約のリマインダーです。
          </p>
          <div style="margin:24px 0;padding:20px;background:#FAF6F1;border-radius:8px;">
            <p style="font-size:12px;color:rgba(26,26,26,0.6);margin:0 0 4px;">施術メニュー</p>
            <p style="font-size:14px;margin:0 0 12px;">${info.menuName}</p>
            <p style="font-size:12px;color:rgba(26,26,26,0.6);margin:0 0 4px;">日時</p>
            <p style="font-size:14px;margin:0 0 12px;">${info.date} ${info.time}</p>
            <p style="font-size:12px;color:rgba(26,26,26,0.6);margin:0 0 4px;">担当</p>
            <p style="font-size:14px;margin:0;">${info.staffName}</p>
          </div>
          <p style="font-size:13px;color:rgba(26,26,26,0.6);line-height:1.8;">
            ご来店を心よりお待ちしております。
          </p>
        </div>
        <div style="padding:16px 24px;background:#1A1A1A;text-align:center;">
          <p style="font-size:11px;color:rgba(255,255,255,0.4);margin:0;">NACREE Beauty Salon</p>
        </div>
      </div>
    `,
  };
}

export function bookingCancellationEmail(info: BookingInfo): {
  subject: string;
  html: string;
} {
  return {
    subject: `【NACREE】ご予約キャンセルのお知らせ`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:'Helvetica Neue',Arial,sans-serif;color:#1A1A1A;">
        <div style="padding:32px 24px;background:#FAF6F1;text-align:center;">
          <h1 style="font-size:20px;letter-spacing:0.2em;color:#B8956A;margin:0;">NACREE</h1>
        </div>
        <div style="padding:32px 24px;">
          <p style="font-size:14px;line-height:1.8;">
            ${info.customerName} 様<br><br>
            以下のご予約がキャンセルされました。
          </p>
          <div style="margin:24px 0;padding:20px;background:#FAF6F1;border-radius:8px;">
            <p style="font-size:12px;color:rgba(26,26,26,0.6);margin:0 0 4px;">施術メニュー</p>
            <p style="font-size:14px;margin:0 0 12px;">${info.menuName}</p>
            <p style="font-size:12px;color:rgba(26,26,26,0.6);margin:0 0 4px;">日時</p>
            <p style="font-size:14px;margin:0;">${info.date} ${info.time}</p>
          </div>
          <p style="font-size:13px;color:rgba(26,26,26,0.6);line-height:1.8;">
            またのご利用をお待ちしております。
          </p>
        </div>
        <div style="padding:16px 24px;background:#1A1A1A;text-align:center;">
          <p style="font-size:11px;color:rgba(255,255,255,0.4);margin:0;">NACREE Beauty Salon</p>
        </div>
      </div>
    `,
  };
}
