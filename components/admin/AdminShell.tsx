"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
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
  IconChat,
} from "@/components/member/icons";
import { ADMIN_NAV, NAV_GROUP_LABELS, type NavItem, type NavKey } from "@/lib/admin/nav";
import type { AttentionCounts } from "@/lib/admin/attention";

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

const ICONS: Record<NavKey, (p: P) => React.ReactNode> = {
  dashboard: IconGrid,
  members: IconUser,
  matches: IconHeart,
  cancellations: IconCalendar,
  reports: IconShield,
  announcements: IconBell,
  ads: IconImage,
  stores: IconCoffee,
  "gift-tickets": IconTicket,
  line: IconChat,
};

const GROUPS = ["daily", "content", "settings"] as const;

function countFor(it: NavItem, counts?: Partial<AttentionCounts>) {
  if (!it.counts || !counts) return 0;
  return it.counts.reduce((s, k) => s + (counts[k] ?? 0), 0);
}

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO === "1";

function LogoutButton({ className }: { className?: string }) {
  if (IS_DEMO) return null;
  return (
    <form action="/admin/logout" method="post">
      <button className={cn("rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-primary-text hover:bg-surface-alt", className)}>
        ログアウト
      </button>
    </form>
  );
}

/**
 * 運営管理画面の枠。
 * PC（lg 以上）：左サイドバー（用途ごとのグループ・選択中は背景色・対応待ちの件数）
 * スマホ・タブレット：上部に名前とログアウト、その下に横スクロールのタブ（選択中のタブへ自動スクロール）
 */
export function AdminShell({
  adminName,
  counts,
  children,
}: {
  adminName: string;
  counts?: Partial<AttentionCounts>;
  children: React.ReactNode;
}) {
  // 静的デモ（trailingSlash）では末尾に / が付くため正規化して判定
  const pathname = usePathname().replace(/(.)\/$/, "$1");
  const isActive = (it: NavItem) =>
    it.exact ? pathname === it.href : pathname === it.href || pathname.startsWith(it.href + "/");

  const activeTab = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    activeTab.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [pathname]);

  return (
    <div className="flex min-h-dvh bg-canvas">
      {/* ── PC：サイドバー ── */}
      <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col border-r border-line bg-surface px-3 pt-6 pb-4 lg:flex">
        <Link href="/admin" className="mb-4 flex items-center gap-2.5 px-3">
          <BrandMark className="h-8 w-8" />
          <span className="min-w-0">
            <span className="block text-[19px] leading-tight font-black tracking-tight text-ink">サツコイ！</span>
            <span className="block text-xs font-semibold text-ink-soft">運営管理</span>
          </span>
        </Link>
        <nav aria-label="運営メニュー" className="flex-1 overflow-y-auto">
          {GROUPS.map((g) => (
            <div key={g} className="mb-2">
              <p className="px-3 pt-3 pb-1 text-xs font-semibold text-ink-soft">{NAV_GROUP_LABELS[g]}</p>
              <ul className="space-y-0.5">
                {ADMIN_NAV.filter((it) => it.group === g).map((it) => {
                  const active = isActive(it);
                  const n = countFor(it, counts);
                  const Icon = ICONS[it.key];
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] text-ink transition-colors",
                          active ? "bg-surface-alt font-bold" : "hover:bg-canvas"
                        )}
                      >
                        <Icon className={cn("h-[22px] w-[22px] shrink-0", active && "stroke-[2.6]")} />
                        <span className="min-w-0 flex-1 truncate">{it.label}</span>
                        {n > 0 && (
                          <span
                            className="num-tnum min-w-5 rounded-full bg-like px-1.5 text-center text-[11px] leading-5 font-bold text-white"
                            aria-label={`対応待ち ${n}件`}
                          >
                            {n}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="mt-2 flex items-center gap-2.5 border-t border-line px-3 pt-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-alt text-xs font-bold text-ink-soft">
            {adminName[0]}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{adminName}</span>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ── スマホ・タブレット：上部バー＋横スクロールのタブ ── */}
        <header className="sticky top-0 z-30 border-b border-line bg-surface lg:hidden">
          <div className="flex items-center gap-2 px-4 pt-2 pb-1.5">
            <Link href="/admin" className="flex min-w-0 items-center gap-2">
              <BrandMark className="h-7 w-7 shrink-0" />
              <span className="text-[17px] font-black tracking-tight text-ink">サツコイ！</span>
              <span className="text-xs font-semibold text-ink-soft max-[359px]:hidden">運営管理</span>
            </Link>
            <span className="ml-auto max-w-[8em] truncate text-[13px] text-ink-soft">{adminName}</span>
            <LogoutButton className="-mr-2" />
          </div>
          <nav
            aria-label="運営メニュー"
            className="flex scroll-px-4 gap-1.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [mask-image:linear-gradient(to_right,black_85%,transparent)] [&::-webkit-scrollbar]:hidden"
          >
            {ADMIN_NAV.map((it) => {
              const active = isActive(it);
              const n = countFor(it, counts);
              const Icon = ICONS[it.key];
              return (
                <Link
                  key={it.href}
                  ref={active ? activeTab : undefined}
                  href={it.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold",
                    active ? "bg-ink text-white" : "bg-surface-alt text-ink"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {it.short}
                  {n > 0 && (
                    <span className="num-tnum min-w-4 rounded-full bg-like px-1 text-center text-[10px] leading-4 font-bold text-white">
                      {n}
                    </span>
                  )}
                </Link>
              );
            })}
            <span aria-hidden className="w-6 shrink-0" />
          </nav>
        </header>
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
