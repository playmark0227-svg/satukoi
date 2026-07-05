"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * 顔写真サムネイル。url が無い／読み込み失敗時はニックネーム頭文字のプレースホルダ。
 */
export function Avatar({
  url,
  name,
  className,
  rounded = "full",
}: {
  url?: string | null;
  name?: string;
  className?: string;
  rounded?: "full" | "xl";
}) {
  const [error, setError] = useState(false);
  const radius = rounded === "full" ? "rounded-full" : "rounded-2xl";
  const showImg = url && !error;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-surface-alt flex items-center justify-center text-ink-faint font-bold",
        radius,
        className
      )}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={name ?? ""}
          onError={() => setError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{name?.[0] ?? "?"}</span>
      )}
    </div>
  );
}
