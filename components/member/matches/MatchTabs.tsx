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
        "relative flex flex-1 items-center justify-center gap-2 py-3.5 text-sm transition-colors",
        active ? "text-display text-primary-strong" : "font-medium text-ink-faint"
      )}
    >
      {label}
      {count ? (
        <span className="num-tnum inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-surface">
          {count}
        </span>
      ) : null}
      {active && (
        <span className="absolute inset-x-6 -bottom-px h-[2px] bg-gold" />
      )}
    </button>
  );
}

function MatchRow({ it, i }: { it: MatchItem; i: number }) {
  return (
    <Link
      href={`/matches/${it.id}`}
      style={{ animationDelay: `${i * 70}ms` }}
      className="animate-fade-up flex items-center gap-3.5 rounded-2xl px-1 py-2.5 transition active:bg-canvas"
    >
      <Avatar
        url={it.photoUrl}
        name={it.nickname}
        className="h-16 w-16 shrink-0 text-xl"
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
      <span className="text-ink-faint">›</span>
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
      <div className="flex border-b border-line bg-surface">
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
      </div>

      <div key={tab} className="space-y-1 px-4 py-3">
        {list.length === 0 ? (
          <p className="animate-fade-in py-10 text-center text-sm text-ink-faint">
            該当するやりとりはありません
          </p>
        ) : (
          list.map((it, i) => <MatchRow key={it.id} it={it} i={i} />)
        )}
      </div>
    </div>
  );
}
