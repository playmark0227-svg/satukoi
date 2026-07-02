"use client";

import { useState } from "react";

/**
 * カード用の写真。ふわっと表示され、ホバーでゆっくりズーム（Ken Burns）。
 * 読み込み失敗時は金の明朝頭文字プレースホルダにフォールバック。
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
      <div className="sheen-host flex h-full w-full items-center justify-center bg-surface-alt">
        <span className="text-display animate-float text-5xl text-gold">
          {name[0] ?? "♡"}
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
      className="animate-fade-in h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.07]"
      style={{ filter: "saturate(0.96)" }}
    />
  );
}
