"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RESIDENCE_AREA_LABELS } from "@/lib/constants";
import { Field } from "@/components/ui/Field";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { UserPhoto } from "@/components/member/UserPhoto";
import { BadgeVerified, BadgeCrown, IconHeart, IconFunnel } from "@/components/member/icons";

export type GridUser = {
  id: string;
  nickname: string;
  age: number;
  area: string;
  areaLabel: string;
  photoUrl: string | null;
  compat: number;
  verified: boolean;
  salon: boolean;
  isNew: boolean;
  /** 自分との関係（申込済み・マッチ中など）。なければ null */
  relation: string | null;
};

type Filter = { ageMin: string; ageMax: string; area: string };

/** 自分から申し込んだ／マッチ中 → ハートを塗る（届いた申込は塗らない） */
const liked = (u: GridUser) => u.relation === "申込済み" || u.relation === "マッチ中";

/**
 * ホームの絞り込み＋お相手グリッド。
 * 絞り込みは端末内で行う（画面遷移なし・静的デモでもそのまま動く）。
 */
export function UserGrid({
  users,
  initial,
  intro,
}: {
  users: GridUser[];
  initial: Filter;
  /** 一覧の上に出す案内（サービス案内カードなど） */
  intro?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Filter>(initial);
  const [applied, setApplied] = useState<Filter>(initial);

  const list = useMemo(() => {
    const min = applied.ageMin ? Number(applied.ageMin) : null;
    const max = applied.ageMax ? Number(applied.ageMax) : null;
    return users.filter(
      (u) =>
        (min === null || u.age >= min) &&
        (max === null || u.age <= max) &&
        (!applied.area || u.area === applied.area)
    );
  }, [users, applied]);

  const activeCount = (applied.ageMin ? 1 : 0) + (applied.ageMax ? 1 : 0) + (applied.area ? 1 : 0);

  const apply = () => {
    setApplied(draft);
    setOpen(false);
  };
  const reset = () => {
    const empty = { ageMin: "", ageMax: "", area: "" };
    setDraft(empty);
    setApplied(empty);
    setOpen(false);
  };

  return (
    <>
      {/* 絞り込み（タップでパネルがなめらかに開閉） */}
      <div className="border-b border-line bg-surface">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-2 px-4 py-3 text-ink transition-opacity active:opacity-60"
        >
          <IconFunnel className="h-5 w-5" />
          <span className="text-sm font-semibold">絞り込み</span>
          {activeCount > 0 && (
            <span className="animate-scale-in num-tnum ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-white">
              {activeCount}
            </span>
          )}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={"ml-auto h-4 w-4 text-ink-soft transition-transform duration-300" + (open ? " rotate-180" : "")}
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <div
          className="grid transition-[grid-template-rows] duration-300 ease-out"
          style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="space-y-3 px-4 pb-4 pt-1">
              <Field label="年齢">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={18}
                    max={120}
                    placeholder="18"
                    value={draft.ageMin}
                    onChange={(e) => setDraft({ ...draft, ageMin: e.target.value })}
                    aria-label="年齢の下限"
                  />
                  <span className="text-ink-faint">〜</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={18}
                    max={120}
                    placeholder="上限"
                    value={draft.ageMax}
                    onChange={(e) => setDraft({ ...draft, ageMax: e.target.value })}
                    aria-label="年齢の上限"
                  />
                  <span className="shrink-0 text-sm text-ink-soft">歳</span>
                </div>
              </Field>
              <Field label="居住地">
                <Select
                  value={draft.area}
                  onChange={(e) => setDraft({ ...draft, area: e.target.value })}
                  aria-label="居住地"
                >
                  <option value="">指定なし</option>
                  {Object.entries(RESIDENCE_AREA_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex gap-2 pt-1">
                <Button type="button" size="md" className="flex-1" onClick={apply}>
                  この条件でさがす
                </Button>
                <Button type="button" variant="secondary" size="md" onClick={reset}>
                  リセット
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 py-4">
        {intro}

        {/* セクション見出し */}
        <div className="flex items-baseline justify-between px-0.5 pt-1">
          <h2 className="text-[15px] font-bold text-ink">おすすめのお相手</h2>
          <span className="num-tnum text-xs text-ink-soft">AI相性順・{list.length}人</span>
        </div>

        {/* お相手グリッド（写真＋下に情報） */}
        {list.length === 0 ? (
          <EmptyState title="該当するお相手がいません" description="絞り込み条件を変えてもう一度お試しください。" />
        ) : (
          <div className="stagger grid grid-cols-2 gap-x-3 gap-y-5">
            {list.map((u) => (
              <Link key={u.id} href={`/users/${u.id}`} className="group block transition-opacity active:opacity-70">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-alt">
                  <UserPhoto url={u.photoUrl} name={u.nickname} />
                  <span className="absolute left-2 top-2 flex items-center gap-1">
                    {u.isNew && (
                      <span className="rounded-md bg-[image:var(--gradient-brand)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                        NEW
                      </span>
                    )}
                    {u.salon && <BadgeCrown size="sm" />}
                  </span>
                  <span className="num-tnum absolute bottom-2 left-2 rounded-md bg-white/95 px-1.5 py-0.5 text-[11px] font-semibold text-ink">
                    相性{u.compat}%
                  </span>
                  {u.relation && (
                    <span className="absolute right-2 top-2 rounded-md bg-ink/75 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {u.relation}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-start justify-between gap-2 px-0.5">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 text-[15px] font-semibold text-ink">
                      <span className="truncate">{u.nickname}</span>
                      {u.verified && <BadgeVerified size="sm" className="shrink-0" />}
                    </p>
                    <p className="num-tnum mt-0.5 text-xs text-ink-soft">
                      {u.age}歳・{u.areaLabel}
                    </p>
                  </div>
                  <span
                    className={
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center transition-transform group-active:scale-90 " +
                      (liked(u) ? "text-like" : "text-ink")
                    }
                  >
                    <IconHeart className="h-6 w-6" filled={liked(u)} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
