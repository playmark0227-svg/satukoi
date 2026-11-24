import { twMerge } from "tailwind-merge";

/**
 * className 結合ユーティリティ（falsy を除去して結合）。
 * tailwind-merge で衝突を解決するので、後に渡した指定（p-0・h-10・w-40 など）が確実に勝つ。
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return twMerge(parts.filter(Boolean).join(" "));
}
