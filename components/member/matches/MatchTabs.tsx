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
        "relative flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-bold transition-colors",
        active ? "text-primary-strong" : "text-ink-faint"
      )}
    >
      {label}
      {count ? (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
          {count}
        </span>
      ) : null}
      {active && (
        <span className="absolute inset-x-6 -bottom-px h-0.5 rounded-full bg-primary" />
      )}
    </button>
  );
}

function MatchRow({ it }: { it: MatchItem }) {
  return (
    <Link
      href={`/matches/${it.id}`}
      className="flex items-center gap-3.5 rounded-2xl px-1 py-2.5 transition active:bg-canvas"
    >
      <Avatar
        url={it.photoUrl}
        name={it.nickname}
        className="h-16 w-16 shrink-0 text-xl"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-bold text-ink">{it.nickname}</p>
        <p className="text-sm text-ink-soft">
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

      <div className="space-y-1 px-4 py-3">
        {list.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-faint">
            該当するやりとりはありません
          </p>
        ) : (
          list.map((it) => <MatchRow key={it.id} it={it} />)
        )}
      </div>
    </div>
  );
}
