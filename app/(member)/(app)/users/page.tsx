import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcAge } from "@/lib/format";
import { compatScore } from "@/lib/compat";
import { RESIDENCE_AREA_LABELS } from "@/lib/constants";
import { BrandHeader } from "@/components/member/BrandHeader";
import { BrandMark } from "@/components/member/BrandMark";
import { EmptyState } from "@/components/ui/EmptyState";
import { UserFilters } from "@/components/member/browse/UserFilters";
import { UserPhoto } from "@/components/member/UserPhoto";
import {
  IconHeart,
  IconSparkle,
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

  const rows = await prisma.member.findMany({
    where,
    include: { photos: { orderBy: { order: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  // AIが相性の良い順に表示（デモでは決定的な擬似スコア。lib/compat.ts 参照）
  const users = rows
    .map((u) => ({ ...u, compat: compatScore(me.id, u.id) }))
    .sort((a, b) => b.compat - a.compat);

  return (
    <div className="flex flex-1 flex-col">
      <BrandHeader unread={unread} bell />
      <UserFilters
        ageMin={sp.ageMin ?? ""}
        ageMax={sp.ageMax ?? ""}
        area={sp.area ?? ""}
      />

      <div className="space-y-4 px-4 py-4">
        {/* サービス案内（控えめなお知らせカード） */}
        <div className="animate-fade-up flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5">
          <BrandMark className="h-10 w-10 shrink-0" />
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold text-ink">
              チャットなしで、カフェで会える
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
              気になる方にデートを申し込むだけ。全員本人確認済みです。
            </p>
          </div>
        </div>

        {/* AIアドバイザー導線 */}
        <Link
          href="/advisor"
          className="animate-fade-up flex items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3 transition-colors hover:bg-surface-alt/50 active:opacity-70"
          style={{ animationDelay: "40ms" }}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-alt text-ink-soft">
            <IconSparkle className="h-4 w-4" />
          </span>
          <span className="flex-1 text-[13.5px] font-bold text-ink">
            AIアドバイザーに相談する
          </span>
          <span className="text-ink-faint">›</span>
        </Link>

        {/* セクション見出し */}
        <div
          className="animate-fade-up flex items-baseline justify-between px-0.5 pt-1"
          style={{ animationDelay: "60ms" }}
        >
          <h2 className="text-[15px] font-bold text-ink">おすすめのお相手</h2>
          <span className="flex items-baseline gap-1.5">
            <span className="text-[11px] text-ink-faint">AI相性順</span>
            <span className="num-tnum text-xs text-ink-faint">{users.length}人</span>
          </span>
        </div>

        {/* ユーザーグリッド（写真＋下に情報） */}
        {users.length === 0 ? (
          <EmptyState
            title="該当するお相手がいません"
            description="絞り込み条件を変えてもう一度お試しください。"
          />
        ) : (
          <div className="stagger grid grid-cols-2 gap-x-3 gap-y-5">
            {users.map((u) => (
              <Link
                key={u.id}
                href={`/users/${u.id}`}
                className="group block transition-opacity active:opacity-70"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-surface-alt">
                  <UserPhoto url={u.photos[0]?.url} name={u.nickname} />
                  {u.accountType === "SALON" && (
                    <span className="absolute left-2 top-2">
                      <BadgeCrown />
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-start justify-between gap-2 px-0.5">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 text-[15px] font-bold text-ink">
                      <span className="truncate">{u.nickname}</span>
                      {u.incomeCertVerified && (
                        <BadgeVerified className="shrink-0" />
                      )}
                    </p>
                    <p className="num-tnum mt-0.5 text-xs text-ink-soft">
                      <span className="font-bold text-primary">相性{u.compat}%</span>
                      ・{calcAge(u.birthDate)}歳・{RESIDENCE_AREA_LABELS[u.residenceArea]}
                    </p>
                  </div>
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-faint transition-colors group-hover:border-primary/40 group-hover:text-primary">
                    <IconHeart className="h-4.5 w-4.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
