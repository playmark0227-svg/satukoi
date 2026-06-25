import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcAge } from "@/lib/format";
import { RESIDENCE_AREA_LABELS } from "@/lib/constants";
import { AppHeader } from "@/components/member/AppHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { UserFilters } from "@/components/member/browse/UserFilters";
import type { Prisma, ResidenceArea } from "@prisma/client";

/**
 * さがす：異性のみ・有効会員・自分以外・ブロック関係（双方）を除外して一覧表示。
 * searchParams: ageMin / ageMax / area で絞り込み。
 */
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ ageMin?: string; ageMax?: string; area?: string }>;
}) {
  const me = await requireMember();
  const sp = await searchParams;

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
  const area = sp.area && sp.area in RESIDENCE_AREA_LABELS ? (sp.area as ResidenceArea) : undefined;

  const birthDate: Prisma.DateTimeFilter = {};
  if (ageMin !== undefined && !Number.isNaN(ageMin)) {
    // ageMin 歳以上 = (今日 - ageMin 年) 以前生まれ
    const d = new Date();
    d.setFullYear(d.getFullYear() - ageMin);
    birthDate.lte = d;
  }
  if (ageMax !== undefined && !Number.isNaN(ageMax)) {
    // ageMax 歳以下 = (今日 - (ageMax + 1) 年) より後に生まれ
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
      <AppHeader title="さがす" />
      <div className="px-4 py-4">
        <UserFilters
          ageMin={sp.ageMin ?? ""}
          ageMax={sp.ageMax ?? ""}
          area={sp.area ?? ""}
        />

        {users.length === 0 ? (
          <EmptyState
            title="該当するお相手がいません"
            description="絞り込み条件を変えてもう一度お試しください。"
          />
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {users.map((u) => (
              <Link key={u.id} href={`/users/${u.id}`} className="block">
                <Card className="overflow-hidden">
                  <Avatar
                    url={u.photos[0]?.url}
                    name={u.nickname}
                    rounded="xl"
                    className="aspect-square w-full text-3xl"
                  />
                  <div className="px-3 py-2.5">
                    <p className="truncate text-sm font-bold text-ink">
                      {u.nickname}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {calcAge(u.birthDate)}歳・
                      {RESIDENCE_AREA_LABELS[u.residenceArea]}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
