import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { IconBell } from "./icons";

/** ブランドヘッダー（ロゴ＋サービス名）。bell 指定時のみお知らせベルを表示。 */
export function BrandHeader({
  unread = 0,
  bell = false,
}: {
  unread?: number;
  bell?: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-15 items-center justify-between border-b border-line/70 bg-surface/80 px-4 py-2.5 backdrop-blur-lg">
      <div className="flex items-center gap-2.5">
        <BrandMark className="h-9 w-9 shadow-[var(--shadow-float)]" />
        <span className="text-xl font-black tracking-tight text-brand-gradient">
          サツコイ！
        </span>
      </div>
      {bell && (
        <Link
          href="/notifications"
          aria-label="お知らせ"
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition hover:bg-primary-soft hover:text-primary-strong"
        >
          <IconBell className="h-6 w-6" />
          {unread > 0 && (
            <span className="animate-pulse-ring absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-surface" />
          )}
        </Link>
      )}
    </header>
  );
}
