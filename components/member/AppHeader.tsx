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
    <header className="sticky top-0 z-20 grid h-14 grid-cols-[4.5rem_1fr_4.5rem] items-center border-b border-line bg-surface px-1.5">
      <div className="flex items-center">
        {backHref && (
          <Link
            href={backHref}
            aria-label="戻る"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-alt active:bg-line"
          >
            <IconChevronLeft className="h-[22px] w-[22px]" />
          </Link>
        )}
      </div>
      <h1 className="truncate text-center text-[16px] font-bold text-ink">{title}</h1>
      <div className="flex items-center justify-end pr-1">{right}</div>
    </header>
  );
}
