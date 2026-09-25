"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/Avatar";
import { IconHome, IconHeart, IconMenu } from "./icons";

// match：そのタブ配下として扱う画面（下層画面でも親タブを点灯させる）
const MATCH = {
  home: ["/users", "/notifications"],
  matches: ["/matches", "/applications", "/survey", "/partners"],
  mypage: ["/mypage"],
  menu: ["/menu", "/payments", "/settings", "/referral", "/tickets", "/info", "/contact"],
};

/** 画面下に専用のアクションバーを持つ画面ではタブバーを出さない */
const HIDE_ON = [/^\/users\/[^/]+\/?$/];

/**
 * Instagram 風のアイコンだけの下タブ。選択中は塗りつぶし（黒）、
 * マイページは自分のプロフィール写真で表す。
 */
export function BottomNav({
  avatarUrl,
  nickname,
  badge = 0,
}: {
  avatarUrl?: string | null;
  nickname: string;
  /** マッチタブに出す未対応件数（届いた申込・日程候補など） */
  badge?: number;
}) {
  const pathname = usePathname();
  if (HIDE_ON.some((re) => re.test(pathname))) return null;
  const on = (key: keyof typeof MATCH) =>
    MATCH[key].some((m) => pathname === m || pathname.startsWith(m + "/"));

  const tab = "relative flex h-[52px] items-center justify-center text-ink transition-opacity active:opacity-60";

  return (
    <nav className="sticky bottom-0 z-20 grid grid-cols-4 border-t border-line-soft bg-surface pb-[env(safe-area-inset-bottom)]">
      <Link href="/users" aria-label="ホーム" aria-current={on("home") ? "page" : undefined} className={tab}>
        <IconHome className="h-[26px] w-[26px]" filled={on("home")} />
      </Link>
      <Link href="/matches" aria-label="マッチ" aria-current={on("matches") ? "page" : undefined} className={tab}>
        <IconHeart className="h-[26px] w-[26px]" filled={on("matches")} />
        {badge > 0 && (
          <span className="absolute left-1/2 top-2.5 ml-2 h-2 w-2 rounded-full bg-like ring-2 ring-surface" />
        )}
      </Link>
      <Link href="/mypage" aria-label="マイページ" aria-current={on("mypage") ? "page" : undefined} className={tab}>
        <span
          className={cn(
            "rounded-full p-[1.5px]",
            on("mypage") ? "bg-ink" : "bg-transparent"
          )}
        >
          <Avatar
            url={avatarUrl}
            name={nickname}
            className="h-[26px] w-[26px] border border-surface text-[11px]"
          />
        </span>
      </Link>
      <Link href="/menu" aria-label="メニュー" aria-current={on("menu") ? "page" : undefined} className={tab}>
        <IconMenu className={cn("h-[26px] w-[26px]", on("menu") && "stroke-[2.6]")} />
      </Link>
    </nav>
  );
}
