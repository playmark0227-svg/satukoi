"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const items = [
  { href: "/users", label: "さがす", icon: "♡" },
  { href: "/matches", label: "やりとり", icon: "✉" },
  { href: "/notifications", label: "お知らせ", icon: "🔔" },
  { href: "/mypage", label: "マイページ", icon: "☺" },
];

export function BottomNav({ unread }: { unread?: number }) {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-20 grid grid-cols-4 border-t border-line bg-surface/95 backdrop-blur">
      {items.map((it) => {
        const active = pathname === it.href || pathname.startsWith(it.href + "/");
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-bold",
              active ? "text-primary" : "text-ink-faint"
            )}
          >
            <span className="text-lg leading-none">{it.icon}</span>
            {it.label}
            {it.href === "/notifications" && unread ? (
              <span className="absolute right-[22%] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
