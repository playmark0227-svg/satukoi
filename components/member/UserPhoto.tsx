"use client";

import { useState } from "react";

/**
 * カード用の写真。読み込み失敗時はニュートラルな頭文字プレースホルダ。
 */
export function UserPhoto({
  url,
  name,
}: {
  url?: string | null;
  name: string;
}) {
  const [error, setError] = useState(false);

  if (!url || error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-surface-alt">
        <span className="text-4xl font-bold text-ink-faint/60">
          {name[0] ?? "?"}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      loading="lazy"
      onError={() => setError(true)}
      className="animate-fade-in h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
    />
  );
}
