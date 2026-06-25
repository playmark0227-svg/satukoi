"use client";

import { useState } from "react";

/** 広告画像。読み込み失敗時はタイトル入りのグラデーションバナーへフォールバック。 */
export function AdImage({ url, title }: { url: string; title: string }) {
  const [error, setError] = useState(false);

  if (error || !url) {
    return (
      <div className="flex h-28 w-full items-center justify-center bg-gradient-to-br from-primary-soft to-primary-tint px-4 text-center">
        <span className="text-sm font-bold text-primary-strong">{title}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={title}
      loading="lazy"
      onError={() => setError(true)}
      className="h-auto w-full object-cover"
    />
  );
}
