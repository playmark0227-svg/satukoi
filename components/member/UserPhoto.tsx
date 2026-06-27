"use client";

import { useState } from "react";

/**
 * カード用の写真。読み込み失敗時はニックネーム頭文字のグラデーション
 * プレースホルダにフォールバック（壊れた画像アイコンを出さない）。
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
        <span className="text-display text-5xl text-gold">{name[0] ?? "♡"}</span>
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
      className="h-full w-full object-cover"
      style={{ filter: "saturate(0.96)" }}
    />
  );
}
