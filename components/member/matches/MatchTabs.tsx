"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";

export type MatchItem = {
  id: string;
  nickname: string;
  age: number;
  area: string;
  photoUrl: string | null;
  status: string;
  statusTone: "primary" | "muted";
};

function TabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-1 items-center justify-center gap-2 py-3.5 text-sm transition-colors duration-200",
        active ? "text-display text-primary-strong" : "font-medium text-ink-faint"
      )}
    >
      {label}
      {count ? (
        <span className="animate-scale-in num-tnum inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-surface">
          {count}
        </span>
      ) : null}
    </button>
  );
}

function MatchRow({ it }: { it: MatchItem }) {
  return (
    <Link
      href={`/matches/${it.id}`}
      className="group flex items-center gap-3.5 rounded-2xl px-1 py-2.5 transition-colors hover:bg-surface active:bg-surface-alt"
    >
      <Avatar
        url={it.photoUrl}
        name={it.nickname}
        className="h-16 w-16 shrink-0 text-xl transition-transform duration-300 group-hover:scale-105"
      />
      <div className="min-w-0 flex-1">
        <p className="text-display truncate text-lg font-medium text-ink">{it.nickname}</p>
        <p className="num-tnum text-sm text-ink-soft">
          {it.age}歳 / {it.area}
        </p>
        <p
          className={cn(
            "mt-0.5 text-sm font-medium",
            it.statusTone === "primary" ? "text-primary-strong" : "text-ink-faint"
          )}
        >
          {it.status}
        </p>
      </div>
      <span className="text-ink-faint transition-transform duration-200 group-hover:translate-x-0.5">
        ›
      </span>
    </Link>
  );
}

export function MatchTabs({
  scheduling,
  confirmed,
}: {
  scheduling: MatchItem[];
  confirmed: MatchItem[];
}) {
  const [tab, setTab] = useState<"scheduling" | "confirmed">("scheduling");
  const list = tab === "scheduling" ? scheduling : confirmed;

  return (
    <div>
      <div className="relative flex border-b border-line bg-surface">
        <TabButton
          label="日程調整中"
          count={scheduling.length}
          active={tab === "scheduling"}
          onClick={() => setTab("scheduling")}
        />
        <TabButton
          label="日程確定"
          count={confirmed.length}
          active={tab === "confirmed"}
          onClick={() => setTab("confirmed")}
        />
        {/* 金のスライドインジケーター */}
        <span
          className={cn(
            "absolute -bottom-px left-0 h-[2px] w-1/2 bg-gold transition-transform duration-300 ease-out",
            tab === "confirmed" && "translate-x-full"
          )}
          style={{ transformOrigin: "center" }}
        />
      </div>

      <div key={tab} className="stagger space-y-1 px-4 py-3">
        {list.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-faint">
            まだやりとりはありません。ホームから気になる方に
            <br />
            デートを申し込んでみましょう。
          </p>
        ) : (
          list.map((it) => <MatchRow key={it.id} it={it} />)
        )}
      </div>
    </div>
  );
}
