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
  top = "brand",
}: {
  segments: Segment[];
  initial?: string;
  /** 固定位置：BrandHeader(h-14) の下か AppHeader(h-12) の下か */
  top?: "brand" | "app";
}) {
  const [active, setActive] = useState(initial ?? segments[0]?.key);
  const current = segments.find((s) => s.key === active) ?? segments[0];

  return (
    <>
      <div
        role="tablist"
        className={cn(
          "sticky z-10 grid border-b border-line-soft bg-surface",
          top === "app" ? "top-12" : "top-14"
        )}
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
                "relative flex items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-colors duration-200",
                on ? "text-ink" : "text-ink-faint"
              )}
            >
              {s.label}
              {s.badge ? (
                <span className="num-tnum inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-like px-1 text-[11px] font-bold text-white">
                  {s.badge}
                </span>
              ) : s.count !== undefined ? (
                <span className="num-tnum text-xs font-medium text-ink-faint">{s.count}</span>
              ) : null}
              <span
                className={cn(
                  "absolute inset-x-0 -bottom-px h-px bg-ink transition-opacity duration-200",
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
