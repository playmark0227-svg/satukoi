import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcAge } from "@/lib/format";
import { compatScore } from "@/lib/compat";
import { RESIDENCE_AREA_LABELS } from "@/lib/constants";
import { BrandHeader } from "@/components/member/BrandHeader";
import { Avatar } from "@/components/ui/Avatar";
import { UserFeed, type FeedUser } from "@/components/member/browse/UserFeed";

/** この日数以内に登録した会員を「新着」としてストーリーの輪で強調 */
const NEW_DAYS = 14;
const isNewMember = (createdAt: Date) => createdAt.getTime() >= Date.now() - NEW_DAYS * 86_400_000;

/**
 * ホーム（Instagram 風）：上に新着のお相手（ストーリー）、下にAI相性順のフィード。
 * 異性のみ・有効会員・自分以外・ブロック関係（双方）を除外。
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
      select: { id: true, applicantId: true, receiverId: true },
    }),
  ]);

  const relation = new Map<string, FeedUser["relation"]>();
  for (const a of myPending) {
    relation.set(a.receiverId, { label: "申込済み", cta: "お返事待ち", href: `/users/${a.receiverId}` });
  }
  for (const a of theirPending) {
    relation.set(a.applicantId, { label: "申込が届いています", cta: "お申込みを確認する", href: "/applications" });
  }
  for (const m of activeMatches) {
    const other = m.applicantId === me.id ? m.receiverId : m.applicantId;
    relation.set(other, { label: "マッチ中", cta: "日程調整を見る", href: `/matches/${m.id}` });
  }

  // AIが相性の良い順に表示（デモでは決定的な擬似スコア。lib/compat.ts 参照）
  const users: FeedUser[] = rows
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
      occupation: u.occupation,
      hobbies: u.hobbies,
      intro: u.selfIntroduction,
      relation: relation.get(u.id) ?? null,
    }))
    .sort((a, b) => b.compat - a.compat);

  // ストーリー：新しく登録した順
  const stories = [...rows].slice(0, 10);

  return (
    <div className="flex flex-1 flex-col">
      <BrandHeader unread={unread} bell />

      {/* ストーリー（新着のお相手） */}
      <section aria-label="新着のお相手" className="pb-3 pt-1">
        <div className="flex gap-3.5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href="/mypage/edit"
            className="flex w-[68px] shrink-0 flex-col items-center gap-1 active:opacity-70"
          >
            <span className="relative">
              <span className="story-ring-seen">
                <Avatar url={me.photos[0]?.url} name={me.nickname} className="h-[58px] w-[58px] text-lg" />
              </span>
              <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white ring-2 ring-surface">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-3 w-3" aria-hidden>
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </span>
            <span className="w-full truncate text-center text-[11px] text-ink-soft">あなた</span>
          </Link>
          {stories.map((u) => {
            const isNew = isNewMember(u.createdAt);
            return (
              <Link
                key={u.id}
                href={`/users/${u.id}`}
                className="flex w-[68px] shrink-0 flex-col items-center gap-1 active:opacity-70"
              >
                <span className={isNew ? "story-ring" : "story-ring-seen"}>
                  <Avatar
                    url={u.photos[0]?.url}
                    name={u.nickname}
                    className="h-[58px] w-[58px] text-lg"
                  />
                </span>
                <span className="w-full truncate text-center text-[11px] text-ink">
                  {u.nickname}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <UserFeed
        users={users}
        initialAgeMin={sp.ageMin ?? ""}
        initialAgeMax={sp.ageMax ?? ""}
        initialArea={sp.area ?? ""}
      />
    </div>
  );
}
