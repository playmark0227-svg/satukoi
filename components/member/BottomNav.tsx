"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/Avatar";
import { IconHome, IconHeart, IconMenu } from "./icons";

// match：そのタブ配下として扱う画面（下層画面でも親タブを点灯させる）
const items = [
  { key: "home", href: "/users", label: "ホーム", match: ["/users", "/notifications"] },
  { key: "matches", href: "/matches", label: "マッチ", match: ["/matches", "/applications", "/survey", "/partners"] },
  { key: "mypage", href: "/mypage", label: "マイページ", match: ["/mypage"] },
  {
    key: "menu",
    href: "/menu",
    label: "メニュー",
    match: ["/menu", "/payments", "/settings", "/referral", "/tickets", "/info", "/contact"],
  },
] as const;

/** 画面下に専用のアクションバーを持つ画面ではタブバーを出さない */
const HIDE_ON = [/^\/users\/[^/]+\/?$/];

/**
 * 下タブ（アイコン＋ラベル）。見た目は Instagram 風：
 * 選択中は黒の塗りアイコン、未選択は線のアイコン。マイページは自分の写真。
 */
export function BottomNav({
  avatarUrl,
  nickname,
  badge = 0,
}: {
  avatarUrl?: string | null;
  nickname: string;
  /** マッチタブに赤い点を出す（お返事待ちの申込が届いている） */
  badge?: number;
}) {
  const pathname = usePathname();
  if (HIDE_ON.some((re) => re.test(pathname))) return null;

  return (
    <nav className="sticky bottom-0 z-20 grid grid-cols-4 border-t border-line bg-surface px-2 pb-[env(safe-area-inset-bottom)]">
      {items.map((it) => {
        const active = it.match.some((m) => pathname === m || pathname.startsWith(m + "/"));
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex flex-col items-center gap-1 pb-2 pt-2 text-[10px] text-ink transition-opacity active:opacity-60",
              active ? "font-bold" : "font-medium text-ink-soft"
            )}
          >
            {it.key === "home" && <IconHome className="h-6 w-6" filled={active} />}
            {it.key === "matches" && <IconHeart className="h-6 w-6" filled={active} />}
            {it.key === "mypage" && (
              <span className={cn("rounded-full p-[1.5px]", active ? "bg-ink" : "bg-transparent")}>
                <Avatar
                  url={avatarUrl}
                  name={nickname}
                  className="h-[23px] w-[23px] border border-surface text-[10px]"
                />
              </span>
            )}
            {it.key === "menu" && <IconMenu className={cn("h-6 w-6", active && "stroke-[2.6]")} />}
            {it.label}
            {it.key === "matches" && badge > 0 && (
              <span className="absolute left-1/2 top-1.5 ml-2.5 h-2 w-2 rounded-full bg-like ring-2 ring-surface" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
