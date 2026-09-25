"use client";

import { cn } from "@/lib/cn";
import { useImageFailed } from "./useImageFailed";

/**
 * 顔写真サムネイル。url が無い／読み込み失敗時はニックネーム頭文字のプレースホルダ。
 * 頭文字を常に下層に敷き、写真はその上に重ねる（失敗しても崩れた表示を出さない）。
 * 名前は必ず隣に表示されるため、写真自体は装飾扱い（alt=""）。
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
  const { failed, ref, onError } = useImageFailed();
  const radius = rounded === "full" ? "rounded-full" : "rounded-2xl";

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-surface-alt flex items-center justify-center text-ink-faint font-bold",
        radius,
        className
      )}
    >
      <span aria-hidden>{name?.[0] ?? "?"}</span>
      {url && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={url}
          alt=""
          onError={onError}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
