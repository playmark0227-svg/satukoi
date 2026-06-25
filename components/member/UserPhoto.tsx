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
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-soft to-primary-tint text-5xl font-black text-primary/70">
        {name[0] ?? "♡"}
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
    />
  );
}
