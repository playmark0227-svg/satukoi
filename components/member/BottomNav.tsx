"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { IconHome, IconHeart, IconUser, IconMenu } from "./icons";

const items = [
  { href: "/users", label: "ホーム", Icon: IconHome },
  { href: "/matches", label: "やりとり", Icon: IconHeart },
  { href: "/mypage", label: "マイページ", Icon: IconUser },
  { href: "/menu", label: "メニュー", Icon: IconMenu },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-20 grid grid-cols-4 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      {items.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold",
              active ? "text-primary" : "text-ink-faint"
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
