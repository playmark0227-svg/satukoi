// ════════════════════════════════════════════════════════════════════
//  運営管理画面の骨格（ページ見出し・セクション・パネル・2カラム詳細）
//  見出しの段差： h1（ページ）20〜24px ＞ h2（セクション）16px ＞ h3（パネル）14px ＞ 本文
// ════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { cn } from "@/lib/cn";
import { IconChevronLeft, IconChevronRight } from "@/components/member/icons";

/** 一覧・詳細ページ上部の戻るリンク */
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mb-2 inline-flex items-center gap-0.5 text-[13px] font-semibold text-primary-text hover:underline"
    >
      <IconChevronLeft className="h-4 w-4" />
      {children}
    </Link>
  );
}

/**
 * ページ見出し。件数は見出しの横、主な操作は右上にまとめる。
 * status … 詳細ページで名前の横に出すステータス
 * meta   … 見出しの下に並べる補足（ID・登録日など）
 */
export function PageHeader({
  title,
  count,
  countUnit = "件",
  description,
  back,
  status,
  meta,
  actions,
}: {
  title: React.ReactNode;
  count?: number;
  countUnit?: string;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  status?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6">
      {back && <BackLink href={back.href}>{back.label}</BackLink>}
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1 className="text-xl font-bold tracking-tight text-ink md:text-2xl">{title}</h1>
            {count != null && (
              <span className="num-tnum text-sm text-ink-soft">
                全 {count.toLocaleString("ja-JP")} {countUnit}
              </span>
            )}
            {status}
          </div>
          {description && <p className="mt-1 max-w-3xl text-sm text-ink-soft">{description}</p>}
          {meta && (
            <div className="num-tnum mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-soft">
              {meta}
            </div>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** ページ内の大きなまとまり（h2）。カードのタイトル（h3）より一段大きい。 */
export function Section({
  title,
  count,
  action,
  id,
  className,
  children,
}: {
  title: React.ReactNode;
  /** 見出し横の件数。null なら出さない */
  count?: number | null;
  action?: React.ReactNode;
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("mb-8 scroll-mt-24", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          {title}
          {count != null && (
            <span className="num-tnum text-sm font-normal text-ink-soft">{count.toLocaleString("ja-JP")}</span>
          )}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** セクション見出し右の「すべて見る」などのリンク */
export function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-primary-text hover:underline">
      {children}
      <IconChevronRight className="h-4 w-4" />
    </Link>
  );
}

/**
 * パネル（白いカード）。中に枠付きの箱を入れ子にしない（区切りは divide-y か bg-canvas の面で）。
 * tone="danger" は取り返しのつかない操作をまとめる枠。
 */
export function Panel({
  tone = "default",
  className,
  children,
  id,
}: {
  tone?: "default" | "danger" | "warning";
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "scroll-mt-24 overflow-hidden rounded-[var(--radius-card)] border bg-surface",
        tone === "danger" ? "border-danger/30" : tone === "warning" ? "border-warning/50" : "border-line",
        className
      )}
    >
      {children}
    </div>
  );
}

/** パネルの見出し帯（タイトル＋説明＋右側の操作） */
export function PanelHeader({
  title,
  description,
  action,
  tone = "default",
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
      <div className="min-w-0">
        <h3 className={cn("text-sm font-bold", tone === "danger" ? "text-danger-strong" : "text-ink")}>{title}</h3>
        {description && <p className="mt-0.5 text-[13px] text-ink-soft">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** パネルの中身。flush は一覧・表のとき（余白なし） */
export function PanelBody({
  flush = false,
  className,
  children,
}: {
  flush?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn(flush ? "p-0" : "p-4", className)}>{children}</div>;
}

/**
 * 詳細ページの2カラム（左：内容、右：ステータスと操作を追従表示）。
 * サイドバーがあるため、2カラムになるのは xl（1280px）以上。それ未満は aside → main の順に縦積み。
 */
export function DetailLayout({ main, aside }: { main: React.ReactNode; aside: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
      <div className="order-2 min-w-0 space-y-6 xl:order-1">{main}</div>
      <aside className="order-1 space-y-4 xl:sticky xl:top-6 xl:order-2">{aside}</aside>
    </div>
  );
}

/** 重要な状態のお知らせ（LINE 未接続・配信停止・要対応の理由など）。統計カードに埋もれさせない。 */
export function Callout({
  tone = "warning",
  title,
  children,
  action,
}: {
  tone?: "warning" | "danger" | "info" | "success";
  title: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const toneClass = {
    warning: "border-warning/40 bg-warning-soft text-warning-strong",
    danger: "border-danger/30 bg-danger-soft text-danger-strong",
    info: "border-primary/30 bg-primary-tint text-primary-text",
    success: "border-success/30 bg-success-soft text-success-strong",
  }[tone];
  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : undefined}
      className={cn("mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2 rounded-[var(--radius-card)] border px-4 py-3 text-sm", toneClass)}
    >
      <div className="min-w-0">
        <p className="font-bold">{title}</p>
        {children && <div className="mt-0.5 text-[13px] leading-relaxed">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** パネル内の短い空表示（ページ全体の EmptyState より小さい） */
export function EmptyInline({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "clear" }) {
  return (
    <p
      className={cn(
        "flex items-center justify-center gap-1.5 px-4 py-8 text-center text-sm",
        tone === "clear" ? "font-semibold text-success-strong" : "text-ink-soft"
      )}
    >
      {tone === "clear" && (
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
          <path d="M4 10.5l4 4 8-8.5" />
        </svg>
      )}
      {children}
    </p>
  );
}

/** 行末の「開く」矢印（装飾） */
export function RowChevron({ className }: { className?: string }) {
  return <IconChevronRight className={cn("h-4 w-4 shrink-0 text-ink-faint", className)} />;
}
