import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcAge, formatSlot } from "@/lib/format";
import { RESIDENCE_AREA_LABELS } from "@/lib/constants";
import { AppHeader } from "@/components/member/AppHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { MemberFacingPhaseBadge } from "@/components/ui/StatusBadge";

/**
 * やりとり：自分が申込側 / 申受側のマッチ一覧。
 * 相手のニックネーム・写真、会員向けフェーズ、確定時は確定日時を表示。
 * 行タップで /matches/[id]（日程調整フロー）へ。
 */
export default async function MatchesPage() {
  const me = await requireMember();

  const matches = await prisma.match.findMany({
    where: {
      OR: [{ applicantId: me.id }, { receiverId: me.id }],
    },
    include: {
      applicant: { include: { photos: { orderBy: { order: "asc" }, take: 1 } } },
      receiver: { include: { photos: { orderBy: { order: "asc" }, take: 1 } } },
      dateEvent: true,
    },
    orderBy: { lastActionAt: "desc" },
  });

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="やりとり" />
      <div className="px-4 py-4">
        {matches.length === 0 ? (
          <EmptyState
            title="やりとり中のお相手がいません"
            description="お申込みが成立すると、ここで日程調整ができます。"
            action={<ButtonLink href="/users" size="md">お相手をさがす</ButtonLink>}
          />
        ) : (
          <div className="space-y-3">
            {matches.map((m) => {
              const other = m.applicantId === me.id ? m.receiver : m.applicant;
              const confirmedAt =
                m.phase === "CONFIRMED" && m.dateEvent
                  ? formatSlot(m.dateEvent.startAt, m.dateEvent.endAt)
                  : null;
              return (
                <Link key={m.id} href={`/matches/${m.id}`} className="block">
                  <Card>
                    <div className="flex items-center gap-3 p-3">
                      <Avatar
                        url={other.photos[0]?.url}
                        name={other.nickname}
                        rounded="xl"
                        className="h-14 w-14 shrink-0 text-xl"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-bold text-ink">
                            {other.nickname}
                          </p>
                          <MemberFacingPhaseBadge phase={m.phase} />
                        </div>
                        <p className="mt-0.5 truncate text-xs text-ink-soft">
                          {calcAge(other.birthDate)}歳・
                          {RESIDENCE_AREA_LABELS[other.residenceArea]}
                        </p>
                        {confirmedAt ? (
                          <p className="mt-1 truncate text-xs font-bold text-primary-strong">
                            {confirmedAt}
                          </p>
                        ) : (
                          <p className="mt-1 truncate text-xs text-ink-faint">
                            日程を調整しましょう
                          </p>
                        )}
                      </div>
                      <span className="text-ink-faint">›</span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

