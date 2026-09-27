"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * なめらかに切り替わるトグルスイッチ。
 * name を渡すとフォーム値（ON のとき "on"）として送信される。
 * autoSubmit なら切り替えた時点で親フォームを送信する
 * （静的デモではフォームが無効なので autoSubmit を渡さない＝見た目だけ切り替わる）。
 */
export function Toggle({
  defaultOn = true,
  label,
  name,
  autoSubmit = false,
}: {
  defaultOn?: boolean;
  label?: string;
  name?: string;
  autoSubmit?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => {
          setOn((v) => !v);
          if (!autoSubmit) return;
          const form = ref.current?.closest("form");
          // hidden input の値が反映されてから送信
          if (form) requestAnimationFrame(() => form.requestSubmit());
        }}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300",
          on ? "bg-primary" : "bg-line"
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 h-5 w-5 rounded-full bg-surface shadow transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            on && "translate-x-5"
          )}
        />
      </button>
      {name && on && <input type="hidden" name={name} value="on" />}
    </>
  );
}
