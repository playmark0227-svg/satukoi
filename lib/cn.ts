/** 軽量 className 結合ユーティリティ（falsy を除去して結合） */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
