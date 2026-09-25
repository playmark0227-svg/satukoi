"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export type Segment = {
  key: string;
  label: string;
  /** バッジ表示する件数（0 / 未指定なら非表示） */
  badge?: number;
  /** 件数を控えめなグレーで表示（バッジほど目立たせない） */
  count?: number;
  content: React.ReactNode;
};

/**
 * 上部タブで中身を切り替える（静的デモでも動くようクライアント側で切替）。
 * 中身はサーバーで描画済みのノードを受け取る。
 */
export function SegmentTabs({
  segments,
  initial,
}: {
  segments: Segment[];
  initial?: string;
}) {
  const [active, setActive] = useState(initial ?? segments[0]?.key);
  const current = segments.find((s) => s.key === active) ?? segments[0];

  return (
    <>
      <div
        role="tablist"
        className="sticky top-14 z-10 grid border-b border-line bg-surface"
        style={{ gridTemplateColumns: `repeat(${segments.length}, minmax(0, 1fr))` }}
      >
        {segments.map((s) => {
          const on = s.key === current?.key;
          return (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(s.key)}
              className={cn(
                "relative flex items-center justify-center gap-1.5 py-3.5 text-sm transition-colors duration-200",
                on ? "font-bold text-ink" : "font-medium text-ink-faint"
              )}
            >
              {s.label}
              {s.badge ? (
                <span className="num-tnum inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
                  {s.badge}
                </span>
              ) : s.count !== undefined ? (
                <span className="num-tnum text-xs font-medium text-ink-faint">{s.count}</span>
              ) : null}
              <span
                className={cn(
                  "absolute inset-x-6 bottom-0 h-0.5 rounded-full bg-primary transition-opacity duration-200",
                  on ? "opacity-100" : "opacity-0"
                )}
              />
            </button>
          );
        })}
      </div>
      <div key={current?.key} className="animate-fade-in">
        {current?.content}
      </div>
    </>
  );
}
