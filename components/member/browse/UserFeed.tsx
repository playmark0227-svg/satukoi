"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { RESIDENCE_AREA_LABELS } from "@/lib/constants";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { UserPhoto } from "@/components/member/UserPhoto";
import {
  BadgeVerified,
  BadgeCrown,
  IconHeart,
  IconFunnel,
  IconChevronRight,
} from "@/components/member/icons";

export type FeedUser = {
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
  occupation: string;
  hobbies: string | null;
  intro: string | null;
  /** 自分との関係（申込済み・マッチ中など）。なければ null */
  relation: { label: string; cta: string; href: string } | null;
};

/**
 * ホームのフィード（Instagram の投稿のように1人ずつ大きく表示）。
 * 絞り込みは端末内で行う（静的デモでも動作し、画面遷移も発生しない）。
 */
export function UserFeed({
  users,
  initialAgeMin = "",
  initialAgeMax = "",
  initialArea = "",
}: {
  users: FeedUser[];
  initialAgeMin?: string;
  initialAgeMax?: string;
  initialArea?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ ageMin: initialAgeMin, ageMax: initialAgeMax, area: initialArea });
  const [applied, setApplied] = useState(draft);

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

  const chips = [
    applied.ageMin || applied.ageMax
      ? `${applied.ageMin || "18"}〜${applied.ageMax ? `${applied.ageMax}歳` : "歳"}`
      : null,
    applied.area ? RESIDENCE_AREA_LABELS[applied.area as keyof typeof RESIDENCE_AREA_LABELS] : null,
  ].filter(Boolean) as string[];

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
    <div>
      {/* 絞り込みバー */}
      <div className="border-b border-line-soft px-4 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition-colors",
              chips.length ? "bg-ink text-white" : "bg-surface-alt text-ink"
            )}
          >
            <IconFunnel className="h-4 w-4" />
            絞り込み
            {chips.length > 0 && <span className="num-tnum">{chips.length}</span>}
          </button>
          {chips.map((c) => (
            <span
              key={c}
              className="inline-flex h-8 shrink-0 items-center rounded-lg border border-line px-3 text-[13px] font-semibold text-ink"
            >
              {c}
            </span>
          ))}
          <span className="num-tnum ml-auto shrink-0 pl-2 text-xs text-ink-soft">
            AI相性順・{list.length}人
          </span>
        </div>

        <div
          className="grid transition-[grid-template-rows] duration-300 ease-out"
          style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="space-y-3 pt-3">
              <div>
                <p className="mb-1.5 text-[13px] font-semibold text-ink">年齢</p>
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
              </div>
              <div>
                <p className="mb-1.5 text-[13px] font-semibold text-ink">居住地</p>
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
              </div>
              <div className="flex gap-2">
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

      {/* フィード */}
      {list.length === 0 ? (
        <div className="px-8 py-16 text-center">
          <p className="text-[15px] font-bold text-ink">該当するお相手がいません</p>
          <p className="mt-1 text-sm text-ink-soft">絞り込み条件を変えてもう一度お試しください。</p>
        </div>
      ) : (
        <div className="stagger">
          {list.map((u) => (
            <Post key={u.id} u={u} />
          ))}
        </div>
      )}
    </div>
  );
}

function Post({ u }: { u: FeedUser }) {
  const href = `/users/${u.id}`;
  const tags = [u.occupation, u.hobbies].filter(Boolean).join("・");
  return (
    <article className="border-b border-line-soft pb-4">
      {/* 投稿ヘッダー */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <Link href={href} className={u.isNew ? "story-ring" : "story-ring-seen"} aria-label={`${u.nickname}さんのプロフィール`}>
          <Avatar url={u.photoUrl} name={u.nickname} className="h-8 w-8 text-xs" />
        </Link>
        <Link href={href} className="min-w-0 flex-1">
          <span className="flex items-center gap-1 text-sm font-semibold text-ink">
            <span className="truncate">{u.nickname}</span>
            {u.verified && <BadgeVerified size="sm" className="shrink-0" />}
            {u.salon && <BadgeCrown size="sm" className="shrink-0" />}
          </span>
          <span className="num-tnum block text-xs text-ink-soft">
            {u.age}歳・{u.areaLabel}
          </span>
        </Link>
        {u.relation ? (
          <span className="shrink-0 rounded-md bg-surface-alt px-2 py-1 text-[11px] font-semibold text-ink-soft">
            {u.relation.label}
          </span>
        ) : (
          <span className="num-tnum shrink-0 rounded-md bg-primary-tint px-2 py-1 text-[11px] font-semibold text-primary">
            AI相性 {u.compat}%
          </span>
        )}
      </div>

      {/* 写真 */}
      <Link href={href} className="block aspect-[4/5] w-full overflow-hidden bg-surface-alt">
        <UserPhoto url={u.photoUrl} name={u.nickname} size="lg" />
      </Link>

      {/* アクション */}
      <div className="flex items-center gap-3 px-3 pt-2.5">
        <Link
          href={u.relation?.href ?? `${href}#apply`}
          aria-label={u.relation?.cta ?? "デートを申し込む"}
          className="-ml-0.5 text-ink transition-transform active:scale-90"
        >
          <IconHeart className="h-[26px] w-[26px]" filled={!!u.relation} />
        </Link>
        <Link href={u.relation?.href ?? `${href}#apply`} className="text-sm font-semibold text-ink">
          {u.relation?.cta ?? "デートを申し込む"}
        </Link>
        <Link
          href={href}
          className="ml-auto inline-flex items-center gap-0.5 text-[13px] font-semibold text-ink-soft"
        >
          プロフィール
          <IconChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* キャプション（自己紹介） */}
      <div className="px-3 pt-1.5">
        {u.intro && (
          <p className="line-clamp-2 text-sm leading-relaxed text-ink">
            <span className="mr-1.5 font-semibold">{u.nickname}</span>
            {u.intro}
          </p>
        )}
        {tags && <p className="mt-1 text-[13px] text-ink-soft">{tags}</p>}
      </div>
    </article>
  );
}
