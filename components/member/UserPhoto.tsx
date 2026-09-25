"use client";

import { useImageFailed } from "@/components/ui/useImageFailed";

/**
 * カード・プロフィール用の写真。読み込み失敗時はニュートラルな頭文字プレースホルダ。
 * 頭文字を常に下層に敷き、写真を上に重ねる（失敗しても崩れた表示を出さない）。
 */
export function UserPhoto({
  url,
  name,
  size = "md",
}: {
  url?: string | null;
  name: string;
  size?: "md" | "lg";
}) {
  const { failed, ref, onError } = useImageFailed();

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-surface-alt">
      <span
        aria-hidden
        className={
          size === "lg"
            ? "text-7xl font-bold text-ink-faint/50"
            : "text-4xl font-bold text-ink-faint/60"
        }
      >
        {name[0] ?? "?"}
      </span>
      {url && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={url}
          alt=""
          loading={size === "lg" ? "eager" : "lazy"}
          onError={onError}
          className="animate-fade-in absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      )}
    </div>
  );
}
