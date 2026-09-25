"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { BrandMark } from "@/components/member/BrandMark";
import {
  IconUser,
  IconHeart,
  IconCalendar,
  IconShield,
  IconBell,
  IconCoffee,
  IconTicket,
} from "@/components/member/icons";

type P = { className?: string };

function IconGrid({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </svg>
  );
}
function IconImage({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

const nav = [
  { href: "/admin", label: "ダッシュボード", short: "ホーム", Icon: IconGrid, exact: true },
  { href: "/admin/members", label: "会員管理", short: "会員", Icon: IconUser },
  { href: "/admin/matches", label: "マッチ＆デート", short: "マッチ", Icon: IconHeart },
  { href: "/admin/cancellations", label: "キャンセル管理", short: "キャンセル", Icon: IconCalendar },
  { href: "/admin/reports", label: "通報・お問い合わせ", short: "通報", Icon: IconShield },
  { href: "/admin/announcements", label: "お知らせ", short: "お知らせ", Icon: IconBell },
  { href: "/admin/ads", label: "広告", short: "広告", Icon: IconImage },
  { href: "/admin/stores", label: "店舗", short: "店舗", Icon: IconCoffee },
  { href: "/admin/gift-tickets", label: "ギフト券", short: "ギフト券", Icon: IconTicket },
];

/** 運営管理画面の枠（Instagram の Web 版のような左サイドバー。スマホは上部の横スクロールタブ） */
export function AdminShell({
  adminName,
  children,
}: {
  adminName: string;
  children: React.ReactNode;
}) {
  // 静的デモ（trailingSlash）では末尾に / が付くため正規化して判定
  const pathname = usePathname().replace(/(.)\/$/, "$1");
  const isActive = (it: (typeof nav)[number]) =>
    it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(it.href + "/");

  return (
    <div className="flex min-h-dvh bg-canvas">
      <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r border-line bg-surface px-3 pb-4 pt-6 md:flex">
        <Link href="/admin" className="mb-6 flex items-center gap-2.5 px-3">
          <BrandMark className="h-8 w-8" />
          <span className="min-w-0">
            <span className="block text-[19px] font-black leading-tight tracking-tight text-ink">サツコイ！</span>
            <span className="block text-[11px] font-semibold text-ink-soft">運営管理</span>
          </span>
        </Link>
        <nav className="flex-1 space-y-0.5">
          {nav.map((it) => {
            const active = isActive(it);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "flex items-center gap-3.5 rounded-lg px-3 py-2.5 text-[15px] text-ink transition-colors hover:bg-surface-alt",
                  active ? "font-bold" : "font-normal"
                )}
              >
                <it.Icon className={cn("h-6 w-6", active && "stroke-[2.6]")} />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-alt text-xs font-bold text-ink-soft">
            {adminName[0]}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{adminName}</span>
          {process.env.NEXT_PUBLIC_DEMO !== "1" && (
            <form action="/admin/logout" method="post">
              <button className="text-xs font-semibold text-primary">ログアウト</button>
            </form>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* スマホ：上部バー＋横スクロールのメニュー */}
        <header className="sticky top-0 z-20 border-b border-line bg-surface md:hidden">
          <div className="flex items-center gap-2 px-4 py-3">
            <BrandMark className="h-7 w-7" />
            <span className="text-[17px] font-black tracking-tight text-ink">サツコイ！</span>
            <span className="text-xs font-semibold text-ink-soft">運営管理</span>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {nav.map((it) => {
              const active = isActive(it);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold",
                    active ? "bg-ink text-white" : "bg-surface-alt text-ink"
                  )}
                >
                  <it.Icon className="h-4 w-4" />
                  {it.short}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-[1100px] flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
