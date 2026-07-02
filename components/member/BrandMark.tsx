import { cn } from "@/lib/cn";
import { IconSparkle } from "./icons";

/** パープル→ピンクのグラデーションチップ＋スパークル。 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-brand-gradient inline-flex items-center justify-center rounded-2xl text-white shadow-[var(--shadow-float)]",
        className
      )}
    >
      <IconSparkle className="animate-twinkle h-1/2 w-1/2" />
    </span>
  );
}
