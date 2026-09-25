import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcAge } from "@/lib/format";
import { compatScore } from "@/lib/compat";
import { RESIDENCE_AREA_LABELS } from "@/lib/constants";
import { BrandHeader } from "@/components/member/BrandHeader";
import { BrandMark } from "@/components/member/BrandMark";
import { UserGrid, type GridUser } from "@/components/member/browse/UserGrid";

/** この日数以内に登録した会員に「NEW」を付ける */
const NEW_DAYS = 14;
const isNewMember = (createdAt: Date) => createdAt.getTime() >= Date.now() - NEW_DAYS * 86_400_000;

/**
 * さがす（ホーム）：異性のみ・有効会員・自分以外・ブロック関係（双方）を除外して一覧表示。
 * searchParams（ageMin / ageMax / area）は絞り込みの初期値として使う。
 */
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ ageMin?: string; ageMax?: string; area?: string }>;
}) {
  const me = await requireMember();
  const sp = await searchParams;

  const oppositeSex = me.sex === "MALE" ? "FEMALE" : "MALE";

  const [unread, blocks] = await Promise.all([
    prisma.notification.count({ where: { memberId: me.id, readAt: null } }),
    prisma.block.findMany({
      where: { OR: [{ blockerId: me.id }, { blockedId: me.id }] },
      select: { blockerId: true, blockedId: true },
    }),
  ]);
  const excludeIds = new Set<string>([me.id]);
  for (const b of blocks) {
    excludeIds.add(b.blockerId);
    excludeIds.add(b.blockedId);
  }

  const [rows, myPending, theirPending, activeMatches] = await Promise.all([
    prisma.member.findMany({
      where: { sex: oppositeSex, status: "ACTIVE", id: { notIn: Array.from(excludeIds) } },
      include: { photos: { orderBy: { order: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.dateApplication.findMany({
      where: { applicantId: me.id, status: "PENDING" },
      select: { receiverId: true },
    }),
    prisma.dateApplication.findMany({
      where: { receiverId: me.id, status: "PENDING" },
      select: { applicantId: true },
    }),
    prisma.match.findMany({
      where: {
        phase: { in: ["SCHEDULING", "CONFIRMED"] },
        OR: [{ applicantId: me.id }, { receiverId: me.id }],
      },
      select: { applicantId: true, receiverId: true },
    }),
  ]);

  // 自分との関係（カードの写真上に表示）
  const relation = new Map<string, string>();
  for (const a of myPending) relation.set(a.receiverId, "申込済み");
  for (const a of theirPending) relation.set(a.applicantId, "申込が届いています");
  for (const m of activeMatches) {
    relation.set(m.applicantId === me.id ? m.receiverId : m.applicantId, "マッチ中");
  }

  // AIが相性の良い順に表示（デモでは決定的な擬似スコア。lib/compat.ts 参照）
  const users: GridUser[] = rows
    .map((u) => ({
      id: u.id,
      nickname: u.nickname,
      age: calcAge(u.birthDate),
      area: u.residenceArea,
      areaLabel: RESIDENCE_AREA_LABELS[u.residenceArea],
      photoUrl: u.photos[0]?.url ?? null,
      compat: compatScore(me.id, u.id),
      verified: u.incomeCertVerified,
      salon: u.accountType === "SALON",
      isNew: isNewMember(u.createdAt),
      relation: relation.get(u.id) ?? null,
    }))
    .sort((a, b) => b.compat - a.compat);

  return (
    <div className="flex flex-1 flex-col">
      <BrandHeader unread={unread} bell />

      <UserGrid
        users={users}
        initial={{ ageMin: sp.ageMin ?? "", ageMax: sp.ageMax ?? "", area: sp.area ?? "" }}
        intro={
          // サービス案内（控えめなお知らせカード）
          <div className="animate-fade-up flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-3.5">
            <BrandMark className="h-10 w-10 shrink-0" />
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-ink">チャットなしで、カフェで会える</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                気になる方にデートを申し込むだけ。全員本人確認済みです。
              </p>
            </div>
          </div>
        }
      />
    </div>
  );
}
