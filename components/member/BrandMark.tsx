import { cn } from "@/lib/cn";
import { IconSparkle } from "./icons";

/** アイボリーの円にシャンパンゴールドの極細リングとスパークル（箔押し風）。 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-surface-alt text-gold",
        className
      )}
      style={{ boxShadow: "inset 0 0 0 1px var(--color-gold)" }}
    >
      <IconSparkle className="animate-twinkle h-1/2 w-1/2" />
    </span>
  );
}
