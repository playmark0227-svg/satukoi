import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { IconBell } from "./icons";

/** ブランドヘッダー（ロゴ＋ワードマーク）。bell 指定時のみベル表示。 */
export function BrandHeader({
  unread = 0,
  bell = false,
}: {
  unread?: number;
  bell?: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-surface/95 px-4 backdrop-blur-lg">
      <div className="flex items-center gap-2">
        <BrandMark className="h-8 w-8" />
        <span className="text-[18px] font-black tracking-tight text-ink">
          サツコイ！
        </span>
      </div>
      {bell && (
        <Link
          href="/notifications"
          aria-label="お知らせ"
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface-alt"
        >
          <IconBell className="h-6 w-6" />
          {unread > 0 && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />
          )}
        </Link>
      )}
    </header>
  );
}
