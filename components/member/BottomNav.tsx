"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { IconHome, IconHeart, IconUser, IconMenu } from "./icons";

const items = [
  { href: "/users", label: "ホーム", Icon: IconHome },
  { href: "/matches", label: "マッチ", Icon: IconHeart },
  { href: "/mypage", label: "マイページ", Icon: IconUser },
  { href: "/menu", label: "メニュー", Icon: IconMenu },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-20 grid grid-cols-4 border-t border-gold-soft bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2.5 backdrop-blur-sm">
      {items.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1.5 pb-1 text-[10px] transition-colors",
              active ? "text-primary" : "text-ink-faint"
            )}
          >
            <Icon className="h-[22px] w-[22px]" filled={active} />
            <span className={active ? "text-display font-medium" : "font-medium"}>
              {label}
            </span>
            <span
              className={cn("h-[1.5px] w-2.5", active ? "bg-gold" : "bg-transparent")}
            />
          </Link>
        );
      })}
    </nav>
  );
}
