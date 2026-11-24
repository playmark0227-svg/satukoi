// ════════════════════════════════════════════════════════════════════
//  数字・一覧・項目表示（運営管理画面）
//    StatTile        … KPI・件数のカード
//    Table / Th / Td … PC（lg 以上）の表
//    MobileList/Row  … スマホ（lg 未満）の一覧
//    RowLink         … 行全体をクリック可能にするリンク
//    KeyValueList    … プロフィールなどの「項目：値」（PC は2列）
//    SummaryGrid     … 詳細ページ上部の要点
//    MemberName      … 会員の表示（どのページでも同じ形）
//    Timestamp       … 短い日時（ホバーで正確な日時）
// ════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatDateTime, formatShortDateTime, formatShortDate } from "@/lib/format";
import { RowChevron } from "./Layout";

// ── StatTile ─────────────────────────────────────────────────────────

export function StatTile({
  label,
  value,
  unit,
  sub,
  href,
  tone = "default",
  meter,
  className,
}: {
  label: React.ReactNode;
  value: number | string;
  unit?: string;
  sub?: React.ReactNode;
  href?: string;
  /** queue … 対応待ちの件数（1以上で黄、0で灰） */
  tone?: "default" | "queue";
  /** 0〜100。上限に対する使用率など */
  meter?: number;
  className?: string;
}) {
  const n = typeof value === "number" ? value : null;
  const waiting = tone === "queue" && n != null && n > 0;
  const idle = tone === "queue" && n === 0;
  const body = (
    <div
      className={cn(
        "h-full rounded-[var(--radius-card)] border p-4 transition-colors",
        waiting ? "border-warning/50 bg-warning-soft/40" : "border-line bg-surface",
        href && (waiting ? "hover:bg-warning-soft/70" : "hover:bg-canvas"),
        className
      )}
    >
      <p className="flex items-center justify-between gap-2 text-[13px] font-semibold text-ink-soft">
        <span className="min-w-0">{label}</span>
        {href && <RowChevron />}
      </p>
      <p className="mt-1 flex items-baseline gap-1">
        <span
          className={cn(
            "num-tnum text-[28px] leading-tight font-bold",
            waiting ? "text-warning-strong" : idle ? "text-ink-faint" : "text-ink"
          )}
        >
          {typeof value === "number" ? value.toLocaleString("ja-JP") : value}
        </span>
        {unit && <span className="text-sm font-semibold text-ink-soft">{unit}</span>}
      </p>
      {meter != null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-alt">
          <div
            className={cn(
              "h-full rounded-full",
              meter >= 90 ? "bg-danger" : meter >= 70 ? "bg-warning" : "bg-primary"
            )}
            style={{ width: `${Math.min(100, Math.max(0, meter))}%` }}
          />
        </div>
      )}
      {sub && <div className="mt-1.5 text-xs text-ink-soft">{sub}</div>}
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

// ── Table（PC） ───────────────────────────────────────────────────────

/** PC 用の表（lg 未満では非表示。スマホは MobileList を併記する） */
export function Table({
  head,
  children,
  className,
  alwaysVisible = false,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** true ならスマホでも表のまま（横スクロール）。列が少ない表向け */
  alwaysVisible?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface",
        !alwaysVisible && "hidden lg:block",
        className
      )}
    >
      <table className="w-full text-sm">
        <thead className="border-b border-line bg-canvas text-left text-xs font-semibold text-ink-soft">
          <tr>{head}</tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function Th({
  children,
  align = "left",
  className,
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-2.5 whitespace-nowrap",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className,
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 align-middle text-ink",
        align === "right" && "num-tnum text-right",
        align === "center" && "text-center",
        className
      )}
    >
      {children}
    </td>
  );
}

/** 表の行のクラス（hover・要対応の左線・終了行の弱め表示）。<tr> や FilterRow に渡す */
export function rowClass({ attention, muted, clickable = true }: { attention?: boolean; muted?: boolean; clickable?: boolean } = {}) {
  return cn(
    "relative",
    clickable && "hover:bg-canvas",
    attention && "shadow-[inset_3px_0_0_var(--color-warning)]",
    muted && "bg-canvas/60 [&_td]:text-ink-soft"
  );
}

/** 行全体をクリック可能にするリンク（親の行に relative が必要） */
export function RowLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={cn("font-bold text-ink after:absolute after:inset-0 hover:underline", className)}>
      {children}
    </Link>
  );
}

// ── MobileList（スマホ） ─────────────────────────────────────────────

/** スマホ用の一覧（lg 以上では非表示） */
export function MobileList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ul
      className={cn(
        "divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface lg:hidden",
        className
      )}
    >
      {children}
    </ul>
  );
}

/**
 * スマホ用の1行。title は太字、meta は「・」区切りの補足、right は状態など。
 * href があれば行全体がリンク。
 */
export function MobileRowContent({
  href,
  title,
  meta,
  right,
  below,
  attention,
  muted,
}: {
  href?: string;
  title: React.ReactNode;
  meta?: React.ReactNode;
  right?: React.ReactNode;
  below?: React.ReactNode;
  attention?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex items-start gap-3 px-4 py-3",
        href && "hover:bg-canvas",
        attention && "shadow-[inset_3px_0_0_var(--color-warning)]",
        muted && "bg-canvas/60"
      )}
    >
      <div className="min-w-0 flex-1">
        <p className={cn("text-[15px] font-bold", muted ? "text-ink-soft" : "text-ink")}>
          {href ? (
            <Link href={href} className="after:absolute after:inset-0">
              {title}
            </Link>
          ) : (
            title
          )}
        </p>
        {meta && <div className="num-tnum mt-0.5 text-[13px] text-ink-soft">{meta}</div>}
        {below && <div className="mt-2">{below}</div>}
      </div>
      {(right || href) && (
        <div className="flex shrink-0 items-center gap-2 self-center">
          {right}
          {href && <RowChevron />}
        </div>
      )}
    </div>
  );
}

// ── KeyValueList / SummaryGrid ───────────────────────────────────────

export type KV = { label: React.ReactNode; value: React.ReactNode; full?: boolean };

/** 「項目：値」の一覧。PC（lg 以上）は2列。値は長くても折り返す */
export function KeyValueList({
  items,
  columns = 2,
  title,
}: {
  items: KV[];
  columns?: 1 | 2;
  title?: React.ReactNode;
}) {
  return (
    <div>
      {title && <p className="px-4 pt-4 pb-1 text-xs font-bold text-ink-soft">{title}</p>}
      <dl className={cn("grid", columns === 2 && "lg:grid-cols-2")}>
        {items.map((it, i) => (
          <div
            key={i}
            className={cn(
              "grid grid-cols-[7rem_minmax(0,1fr)] gap-3 border-b border-line-soft px-4 py-2.5 sm:grid-cols-[9rem_minmax(0,1fr)]",
              it.full && "lg:col-span-2"
            )}
          >
            <dt className="text-[13px] text-ink-soft">{it.label}</dt>
            <dd className="min-w-0 text-sm font-medium text-ink [overflow-wrap:anywhere]">{it.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** 詳細ページ上部の要点（2〜4列） */
export function SummaryGrid({ items, className }: { items: KV[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4", className)}>
      {items.map((it, i) => (
        <div key={i} className={cn("min-w-0", it.full && "col-span-2 md:col-span-4")}>
          <dt className="text-xs font-semibold text-ink-soft">{it.label}</dt>
          <dd className="num-tnum mt-0.5 text-sm font-medium text-ink [overflow-wrap:anywhere]">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

// ── MemberName ───────────────────────────────────────────────────────

/**
 * 会員の表示。どのページでも「（役割）ニックネームさん（本名）」の同じ形で、会員詳細へのリンク。
 * full=false なら本名を出さない。
 */
export function MemberName({
  member,
  role,
  link = true,
  full = true,
  className,
}: {
  member: { id: string; nickname: string; fullName?: string | null };
  role?: string;
  link?: boolean;
  full?: boolean;
  className?: string;
}) {
  const name = (
    <>
      {member.nickname}
      <span className="font-normal">さん</span>
    </>
  );
  return (
    <span className={cn("inline-flex min-w-0 flex-wrap items-baseline gap-x-1", className)}>
      {role && <span className="text-xs font-medium text-ink-soft">{role}</span>}
      {link ? (
        <Link href={`/admin/members/${member.id}`} className="relative z-10 font-bold text-ink hover:underline">
          {name}
        </Link>
      ) : (
        <span className="font-bold text-ink">{name}</span>
      )}
      {full && member.fullName && (
        <span className="text-[13px] whitespace-nowrap text-ink-soft">（{member.fullName}）</span>
      )}
    </span>
  );
}

// ── Timestamp ────────────────────────────────────────────────────────

/** 短い日時（今年は年を省略）。ホバーで正確な日時 */
export function Timestamp({
  date,
  dateOnly = false,
  className,
}: {
  date: Date | string;
  dateOnly?: boolean;
  className?: string;
}) {
  const d = typeof date === "string" ? new Date(date) : date;
  return (
    <time dateTime={d.toISOString()} title={formatDateTime(d)} className={cn("num-tnum whitespace-nowrap", className)}>
      {dateOnly ? formatShortDate(d) : formatShortDateTime(d)}
    </time>
  );
}
