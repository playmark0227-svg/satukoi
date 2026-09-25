"use client";

import { useImageFailed } from "@/components/ui/useImageFailed";

/** 広告画像。読み込み失敗時はタイトル入りのプレーンなバナーへフォールバック。 */
export function AdImage({ url, title }: { url: string; title: string }) {
  const { failed, ref, onError } = useImageFailed();

  if (failed || !url) {
    return (
      <div className="flex h-28 w-full items-center justify-center bg-surface-alt px-4 text-center">
        <span className="text-sm font-bold text-ink-soft">{title}</span>
      </div>
    );
  }

  return (
    // 失敗時に代替テキストが崩れて出ないよう alt は空（タイトルはリンクの aria-label で伝える）
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={url}
      alt=""
      loading="lazy"
      onError={onError}
      className="h-auto w-full object-cover"
    />
  );
}
