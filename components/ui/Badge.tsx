import { cn } from "@/lib/cn";

export type Tone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "gold";

const tones: Record<Tone, string> = {
  neutral: "bg-surface border-line text-ink-soft",
  primary: "bg-surface border-gold-soft text-primary",
  success: "bg-success-soft border-success/40 text-success",
  warning: "bg-warning-soft border-warning/40 text-warning",
  danger: "bg-danger-soft border-danger/40 text-danger",
  info: "bg-info-soft border-info/40 text-info",
  gold: "bg-surface border-gold text-[color:var(--color-primary-strong)]",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[6px] border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
