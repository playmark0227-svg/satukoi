import { cn } from "@/lib/cn";

/** 会員登録の進行ステップ表示（①〜④） */
export function Stepper({
  steps,
  current,
}: {
  steps: string[];
  current: number; // 1-based
}) {
  return (
    <ol className="flex items-center gap-1.5">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                done && "bg-primary text-white",
                active && "bg-primary text-white ring-4 ring-primary-soft",
                !done && !active && "bg-line text-ink-faint"
              )}
            >
              {done ? "✓" : n}
            </div>
            <span
              className={cn(
                "text-[10px]",
                active ? "font-bold text-ink" : "text-ink-faint"
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
