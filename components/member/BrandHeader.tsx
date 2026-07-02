import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { IconBell } from "./icons";

/** ブランドヘッダー（明朝のワードマーク＋ゴールドの極細罫）。bell 指定時のみベル表示。 */
export function BrandHeader({
  unread = 0,
  bell = false,
}: {
  unread?: number;
  bell?: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gold-soft bg-surface/95 px-4 backdrop-blur-sm">
      <div className="animate-fade-in flex items-center gap-2.5">
        <BrandMark className="h-9 w-9" />
        <span className="text-display text-foil text-2xl font-medium">サツコイ！</span>
      </div>
      {bell && (
        <Link
          href="/notifications"
          aria-label="お知らせ"
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition hover:bg-surface-alt hover:text-primary"
        >
          <IconBell className={unread > 0 ? "animate-bell h-6 w-6" : "h-6 w-6"} />
          {unread > 0 && (
            <span className="animate-pulse-gold absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-surface" />
          )}
        </Link>
      )}
    </header>
  );
}
