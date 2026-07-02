"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/** なめらかに切り替わるトグルスイッチ（デモ用：ローカル状態のみ）。 */
export function Toggle({ defaultOn = true, label }: { defaultOn?: boolean; label?: string }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => setOn((v) => !v)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300",
        on ? "bg-primary" : "bg-line"
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 h-5 w-5 rounded-full bg-surface shadow transition-transform duration-300 ease-out",
          on && "translate-x-5"
        )}
      />
    </button>
  );
}
