import { cn } from "@/lib/cn";

/**
 * 顔写真サムネイル。url が無い場合はニックネーム頭文字のプレースホルダ。
 * 本スキャフォルドではアップロード画像は未配信のため、url 指定時のみ表示。
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
  const radius = rounded === "full" ? "rounded-full" : "rounded-2xl";
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-primary-soft flex items-center justify-center text-primary-strong font-bold",
        radius,
        className
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name ?? ""} className="h-full w-full object-cover" />
      ) : (
        <span className="text-lg">{name?.[0] ?? "♡"}</span>
      )}
    </div>
  );
}
