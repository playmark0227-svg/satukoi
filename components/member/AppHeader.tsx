import Link from "next/link";

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
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-surface/95 px-2 backdrop-blur">
      <div className="flex w-12 items-center">
        {backHref && (
          <Link
            href={backHref}
            aria-label="戻る"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:bg-line/60"
          >
            ‹
          </Link>
        )}
      </div>
      <h1 className="truncate text-base font-bold text-ink">{title}</h1>
      <div className="flex w-12 items-center justify-end">{right}</div>
    </header>
  );
}
