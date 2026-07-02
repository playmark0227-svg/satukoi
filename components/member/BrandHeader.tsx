import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { IconBell } from "./icons";

/** ブランドヘッダー（グラデーションロゴ＋ワードマーク）。bell 指定時のみベル表示。 */
export function BrandHeader({
  unread = 0,
  bell = false,
}: {
  unread?: number;
  bell?: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-15 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur-lg">
      <div className="animate-fade-in flex items-center gap-2.5">
        <BrandMark className="h-9 w-9" />
        <span className="text-display text-foil text-[22px]">サツコイ！</span>
      </div>
      {bell && (
        <Link
          href="/notifications"
          aria-label="お知らせ"
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition hover:bg-primary-soft hover:text-primary-strong"
        >
          <IconBell className={unread > 0 ? "animate-bell h-6 w-6" : "h-6 w-6"} />
          {unread > 0 && (
            <span className="animate-pulse-ring absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-surface" />
          )}
        </Link>
      )}
    </header>
  );
}
