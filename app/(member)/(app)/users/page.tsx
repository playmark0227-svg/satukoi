import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcAge } from "@/lib/format";
import { RESIDENCE_AREA_LABELS } from "@/lib/constants";
import { BrandHeader } from "@/components/member/BrandHeader";
import { BrandMark } from "@/components/member/BrandMark";
import { EmptyState } from "@/components/ui/EmptyState";
import { UserFilters } from "@/components/member/browse/UserFilters";
import { UserPhoto } from "@/components/member/UserPhoto";
import {
  IconHeart,
  BadgeVerified,
  BadgeCrown,
} from "@/components/member/icons";
import type { Prisma, ResidenceArea } from "@prisma/client";

/**
 * さがす（ホーム）：異性のみ・有効会員・自分以外・ブロック関係（双方）を除外して一覧表示。
 * searchParams: ageMin / ageMax / area で絞り込み。
 */
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ ageMin?: string; ageMax?: string; area?: string }>;
}) {
  const me = await requireMember();
  const sp = await searchParams;

  const unread = await prisma.notification.count({
    where: { memberId: me.id, readAt: null },
  });

  const oppositeSex = me.sex === "MALE" ? "FEMALE" : "MALE";

  // ── ブロック関係（双方）の相手IDを集める ──
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: me.id }, { blockedId: me.id }] },
    select: { blockerId: true, blockedId: true },
  });
  const excludeIds = new Set<string>([me.id]);
  for (const b of blocks) {
    excludeIds.add(b.blockerId);
    excludeIds.add(b.blockedId);
  }

  // ── 年齢レンジ → 生年月日レンジへ変換 ──
  const ageMin = sp.ageMin ? Number(sp.ageMin) : undefined;
  const ageMax = sp.ageMax ? Number(sp.ageMax) : undefined;
  const area =
    sp.area && sp.area in RESIDENCE_AREA_LABELS ? (sp.area as ResidenceArea) : undefined;

  const birthDate: Prisma.DateTimeFilter = {};
  if (ageMin !== undefined && !Number.isNaN(ageMin)) {
    const d = new Date();
    d.setFullYear(d.getFullYear() - ageMin);
    birthDate.lte = d;
  }
  if (ageMax !== undefined && !Number.isNaN(ageMax)) {
    const d = new Date();
    d.setFullYear(d.getFullYear() - (ageMax + 1));
    birthDate.gt = d;
  }

  const where: Prisma.MemberWhereInput = {
    sex: oppositeSex,
    status: "ACTIVE",
    id: { notIn: Array.from(excludeIds) },
    ...(area ? { residenceArea: area } : {}),
    ...(Object.keys(birthDate).length > 0 ? { birthDate } : {}),
  };

  const users = await prisma.member.findMany({
    where,
    include: { photos: { orderBy: { order: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-1 flex-col">
      <BrandHeader unread={unread} bell />
      <UserFilters
        ageMin={sp.ageMin ?? ""}
        ageMax={sp.ageMax ?? ""}
        area={sp.area ?? ""}
      />

      <div className="space-y-5 px-4 py-5">
        {/* プロモバナー（公式ロゴを主役に） */}
        <div className="animate-fade-up flex items-center gap-3.5 rounded-3xl border border-primary/15 bg-gradient-to-br from-primary-tint via-surface to-surface p-4 shadow-[var(--shadow-card)]">
          <BrandMark className="animate-float h-13 w-13 shrink-0" />
          <div className="min-w-0">
            <p className="text-display text-[15px] text-primary-strong">
              素敵な出会いが、待っています
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
              チャットのやり取りは不要。気になる方にデートを申し込むだけで、
              札幌のカフェでお会いできます。
            </p>
          </div>
        </div>

        {/* サービスの約束（ひと目で分かるUSP・3等分） */}
        <div className="stagger grid grid-cols-3 gap-2">
          {["チャット不要", "本人確認済み", "カフェで60分"].map((t) => (
            <span
              key={t}
              className="inline-flex items-center justify-center gap-1 rounded-full border border-primary/15 bg-surface px-2 py-1.5 text-[11px] font-bold text-ink-soft shadow-[var(--shadow-card)]"
            >
              <span className="text-primary">✓</span>
              {t}
            </span>
          ))}
        </div>

        {/* セクション見出し */}
        <div className="animate-fade-up pt-1" style={{ animationDelay: "120ms" }}>
          <p className="caps-label text-center text-[10px] font-bold text-primary">
            Pick Up
          </p>
          <h2 className="text-display mt-1 text-center text-lg text-ink">
            あなたにおすすめのお相手
          </h2>
          <div className="rule-letter mt-2.5">
            <span>♥</span>
          </div>
        </div>

        {/* ユーザーグリッド */}
        {users.length === 0 ? (
          <EmptyState
            title="該当するお相手がいません"
            description="絞り込み条件を変えてもう一度お試しください。"
          />
        ) : (
          <div className="stagger grid grid-cols-2 gap-3.5">
            {users.map((u) => (
              <Link
                key={u.id}
                href={`/users/${u.id}`}
                className="group relative block aspect-[3/4] overflow-hidden rounded-3xl bg-line shadow-[var(--shadow-card)] ring-1 ring-black/5 transition-[transform,box-shadow] duration-300 active:scale-[0.98] sm:hover:-translate-y-1 sm:hover:shadow-[var(--shadow-pop)]"
              >
                <UserPhoto url={u.photos[0]?.url} name={u.nickname} />

                {/* 下部グラデーション＋情報オーバーレイ */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent px-3.5 pb-3.5 pt-12">
                  <div className="flex items-center gap-1.5">
                    <span className="text-display truncate text-lg text-white drop-shadow-sm">
                      {u.nickname}
                    </span>
                    {u.incomeCertVerified && <BadgeVerified />}
                    {u.accountType === "SALON" && <BadgeCrown />}
                  </div>
                  <p className="num-tnum mt-0.5 text-xs font-medium text-white/90">
                    {calcAge(u.birthDate)}歳・{RESIDENCE_AREA_LABELS[u.residenceArea]}
                  </p>
                </div>

                {/* いいねハート */}
                <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-primary shadow-[var(--shadow-float)] transition-transform duration-200 group-hover:scale-110 group-active:scale-90">
                  <IconHeart className="h-5 w-5 transition-transform duration-200 group-hover:animate-heart" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
