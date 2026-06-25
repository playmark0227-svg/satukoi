import { cn } from "@/lib/cn";
import { IconSparkle } from "./icons";

/** 紫→ピンクのグラデーション角丸ロゴ＋スパークル。 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-2xl text-white shadow-sm",
        className
      )}
      style={{
        background:
          "linear-gradient(135deg, var(--color-accent-violet), var(--color-primary))",
      }}
    >
      <IconSparkle className="h-1/2 w-1/2" />
    </span>
  );
}
