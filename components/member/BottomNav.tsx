"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { IconHome, IconHeart, IconUser, IconMenu } from "./icons";

// match：そのタブ配下として扱う画面（下層画面でも親タブを点灯させる）
const items = [
  { href: "/users", label: "ホーム", Icon: IconHome, match: ["/users", "/advisor", "/notifications"] },
  { href: "/matches", label: "マッチ", Icon: IconHeart, match: ["/matches", "/applications", "/survey", "/partners"] },
  { href: "/mypage", label: "マイページ", Icon: IconUser, match: ["/mypage"] },
  {
    href: "/menu",
    label: "メニュー",
    Icon: IconMenu,
    match: ["/menu", "/payments", "/settings", "/referral", "/tickets", "/info", "/contact"],
  },
] as const;

/** 画面下に専用のアクションバーを持つ画面ではタブバーを出さない */
const HIDE_ON = [/^\/users\/[^/]+\/?$/];

export function BottomNav() {
  const pathname = usePathname();
  if (HIDE_ON.some((re) => re.test(pathname))) return null;
  return (
    <nav className="sticky bottom-0 z-20 grid grid-cols-4 border-t border-line bg-surface px-2 pb-[env(safe-area-inset-bottom)]">
      {items.map(({ href, label, Icon, match }) => {
        const active = match.some((m) => pathname === m || pathname.startsWith(m + "/"));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 pb-2 pt-2.5 text-[10px] transition-colors duration-150 active:opacity-70",
              active ? "font-bold text-primary" : "font-medium text-ink-faint"
            )}
          >
            <Icon className="h-6 w-6" filled={active} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
