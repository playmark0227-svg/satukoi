"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { SERVICE_NAME } from "@/lib/constants";

const nav = [
  { href: "/admin", label: "ダッシュボード", exact: true },
  { href: "/admin/members", label: "会員管理" },
  { href: "/admin/matches", label: "マッチ＆デート管理" },
  { href: "/admin/cancellations", label: "キャンセル・ペナルティ" },
  { href: "/admin/reports", label: "通報・お問い合わせ" },
  { href: "/admin/announcements", label: "お知らせ" },
  { href: "/admin/ads", label: "広告" },
  { href: "/admin/stores", label: "店舗" },
];

export function AdminShell({
  adminName,
  children,
}: {
  adminName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-dvh bg-canvas">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface md:flex">
        <div className="border-b border-line px-5 py-4">
          <p className="text-sm font-bold text-primary">{SERVICE_NAME}</p>
          <p className="text-xs text-ink-faint">運営管理</p>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {nav.map((it) => {
            const active = it.exact
              ? pathname === it.href
              : pathname.startsWith(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm font-medium",
                  active
                    ? "bg-primary-soft text-primary-strong"
                    : "text-ink-soft hover:bg-canvas"
                )}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
        <form action="/admin/logout" method="post" className="border-t border-line p-3">
          <p className="px-1 pb-2 text-xs text-ink-faint">{adminName}</p>
          <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-ink-soft hover:bg-canvas">
            ログアウト
          </button>
        </form>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* モバイル用上部バー */}
        <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:hidden">
          <span className="text-sm font-bold text-primary">{SERVICE_NAME} 運営</span>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
