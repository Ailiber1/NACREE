"use client";

const STEPS = ["メニュー", "スタッフ", "日時", "確認"];

export function BookingSteps({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-10 md:mb-14">
      {STEPS.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === current;
        const isDone = stepNum < current;
        return (
          <div key={label} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 flex items-center justify-center text-xs ${
                  isActive
                    ? "bg-[var(--color-antique-gold)] text-white"
                    : isDone
                    ? "bg-[var(--color-deep-charcoal)] text-white"
                    : "bg-[var(--color-border)] text-[var(--color-muted)]"
                }`}
                style={{ borderRadius: "50%", fontFamily: "'Inter', sans-serif" }}
              >
                {stepNum}
              </span>
              <span
                className={`text-xs tracking-wide hidden sm:inline ${
                  isActive ? "text-[var(--color-deep-charcoal)] font-medium" : "text-[var(--color-muted)]"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-6 sm:w-10 h-px ${
                  isDone ? "bg-[var(--color-deep-charcoal)]" : "bg-[var(--color-border)]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
