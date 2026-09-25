import Link from "next/link";
import { IconChevronLeft } from "./icons";

/** 画面上部ヘッダー。戻る導線・右アクションを任意で表示。 */
export function AppHeader({
  title,
  backHref,
  right,
}: {
  title: string;
  backHref?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 grid h-12 grid-cols-[4.5rem_1fr_4.5rem] items-center border-b border-line-soft bg-surface px-1.5">
      <div className="flex items-center">
        {backHref && (
          <Link
            href={backHref}
            aria-label="戻る"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-opacity active:opacity-60"
          >
            <IconChevronLeft className="h-6 w-6" />
          </Link>
        )}
      </div>
      <h1 className="truncate text-center text-base font-bold text-ink">{title}</h1>
      <div className="flex items-center justify-end pr-1">{right}</div>
    </header>
  );
}
