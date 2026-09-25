import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { IconBell } from "./icons";

/** ブランドヘッダー（Instagram のトップバー風：左にロゴ、右にアイコン）。 */
export function BrandHeader({
  unread = 0,
  bell = false,
  title,
  right,
}: {
  unread?: number;
  bell?: boolean;
  /** 右端に置く任意の要素（「リクエスト」リンク等） */
  right?: React.ReactNode;
  /** 指定時はワードマークの代わりに画面名を太字で出す（マッチ・マイページ等） */
  title?: string;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-surface px-4">
      {title ? (
        <h1 className="text-[22px] font-bold tracking-tight text-ink">{title}</h1>
      ) : (
        <Link href="/users" className="flex items-center gap-2" aria-label="ホーム">
          <BrandMark className="h-8 w-8" />
          <span className="text-[21px] font-black tracking-tight text-ink">サツコイ！</span>
        </Link>
      )}
      {right}
      {bell && (
        <Link
          href="/notifications"
          aria-label={unread > 0 ? `お知らせ（未読${unread}件）` : "お知らせ"}
          className="relative -mr-2 flex h-10 w-10 items-center justify-center rounded-full text-ink transition-opacity active:opacity-60"
        >
          <IconBell className="h-[26px] w-[26px]" />
          {unread > 0 && (
            <span className="num-tnum absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-like px-1 text-[11px] font-bold text-white ring-2 ring-surface">
              {unread}
            </span>
          )}
        </Link>
      )}
    </header>
  );
}
