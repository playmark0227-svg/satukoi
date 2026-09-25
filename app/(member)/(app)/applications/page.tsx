import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcAge, fromNow } from "@/lib/format";
import {
  RESIDENCE_AREA_LABELS,
  APPLICATION_STATUS_LABELS,
  SCHEDULING_RULES,
} from "@/lib/constants";
import { AppHeader } from "@/components/member/AppHeader";
import { SegmentTabs } from "@/components/member/matches/SegmentTabs";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Badge, type Tone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button, ButtonLink } from "@/components/ui/Button";
import type { ApplicationStatus } from "@prisma/client";
import { acceptApplication, declineApplication } from "./actions";

const statusTone: Record<ApplicationStatus, Tone> = {
  PENDING: "warning",
  ACCEPTED: "success",
  DECLINED: "neutral",
  CANCELLED: "neutral",
  EXPIRED: "neutral",
};

type Item = {
  id: string;
  other: {
    id: string;
    nickname: string;
    birthDate: Date;
    residenceArea: keyof typeof RESIDENCE_AREA_LABELS;
    photos: { url: string }[];
  };
  status: ApplicationStatus;
  message: string | null;
  createdAt: Date;
};

/**
 * お申込み：受け取った申込 / 送った申込 をタブで切り替えて一覧表示。
 * 受け取った申込（お返事待ち）は、その場で「承諾する／見送る」を選べる。
 * searchParams.tab = "sent" | "received"（既定 received）。
 */
export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const me = await requireMember();
  const sp = await searchParams;
  const initial = sp.tab === "sent" ? "sent" : "received";

  const [sent, received] = await Promise.all([
    prisma.dateApplication.findMany({
      where: { applicantId: me.id },
      include: {
        receiver: { include: { photos: { orderBy: { order: "asc" }, take: 1 } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.dateApplication.findMany({
      where: { receiverId: me.id },
      include: {
        applicant: { include: { photos: { orderBy: { order: "asc" }, take: 1 } } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const sentItems: Item[] = sent.map((a) => ({ ...a, other: a.receiver }));
  // お返事待ちを先頭に（同じ状態の中では新しい順のまま）
  const receivedItems: Item[] = received
    .map((a) => ({ ...a, other: a.applicant }))
    .sort((a, b) => Number(b.status === "PENDING") - Number(a.status === "PENDING"));
  const pendingCount = receivedItems.filter((a) => a.status === "PENDING").length;
  const proposeDays = SCHEDULING_RULES.FIRST_PROPOSAL_DEADLINE_HOURS / 24;

  return (
    <div className="flex flex-1 flex-col pb-6">
      <AppHeader title="お申込み" backHref="/matches" />

      <SegmentTabs
        initial={initial}
        segments={[
          {
            key: "received",
            label: "受け取った申込",
            badge: pendingCount,
            count: pendingCount ? undefined : receivedItems.length,
            content: (
              <List
                items={receivedItems}
                empty={
                  <EmptyState
                    title="受け取ったお申込みはありません"
                    description="お相手からのお申込みがここに表示されます。"
                  />
                }
                renderActions={(item) =>
                  item.status === "PENDING" ? (
                    <div className="mt-3 border-t border-line pt-3">
                      <div className="grid grid-cols-2 gap-2">
                        <form action={declineApplication}>
                          <input type="hidden" name="applicationId" value={item.id} />
                          <Button type="submit" variant="outline" size="md" className="w-full">
                            見送る
                          </Button>
                        </form>
                        <form action={acceptApplication}>
                          <input type="hidden" name="applicationId" value={item.id} />
                          <Button type="submit" variant="primary" size="md" className="w-full">
                            承諾する
                          </Button>
                        </form>
                      </div>
                      <p className="mt-2 text-center text-[11px] leading-relaxed text-ink-faint">
                        承諾するとマッチ成立です。{proposeDays}日以内に日程候補（
                        {SCHEDULING_RULES.MIN_CANDIDATES}件以上）をご提示ください。
                      </p>
                    </div>
                  ) : null
                }
              />
            ),
          },
          {
            key: "sent",
            label: "送った申込",
            count: sentItems.length,
            content: (
              <List
                items={sentItems}
                empty={
                  <EmptyState
                    title="送ったお申込みはありません"
                    description="気になるお相手にデートを申し込んでみましょう。"
                    action={
                      <ButtonLink href="/users" size="md">
                        お相手をさがす
                      </ButtonLink>
                    }
                  />
                }
              />
            ),
          },
        ]}
      />
    </div>
  );
}

function List({
  items,
  empty,
  renderActions,
}: {
  items: Item[];
  empty: React.ReactNode;
  renderActions?: (item: Item) => React.ReactNode;
}) {
  if (items.length === 0) return <div className="px-4 py-4">{empty}</div>;
  return (
    <div className="stagger space-y-3 px-4 py-4">
      {items.map((item) => (
        <Card key={item.id}>
          <div className="p-4">
            <Link href={`/users/${item.other.id}`} className="flex items-start gap-3">
              <Avatar
                url={item.other.photos[0]?.url}
                name={item.other.nickname}
                className="h-14 w-14 text-xl"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[15px] font-bold text-ink">
                    {item.other.nickname}
                  </p>
                  <Badge tone={statusTone[item.status]} className="shrink-0">
                    {item.status === "PENDING" ? "お返事待ち" : APPLICATION_STATUS_LABELS[item.status]}
                  </Badge>
                </div>
                <p className="num-tnum mt-0.5 text-[13px] text-ink-soft">
                  {calcAge(item.other.birthDate)}歳・{RESIDENCE_AREA_LABELS[item.other.residenceArea]}
                </p>
                <p className="num-tnum mt-0.5 text-[11px] text-ink-faint">{fromNow(item.createdAt)}</p>
              </div>
            </Link>
            {item.message && (
              <p className="mt-3 rounded-xl bg-surface-alt px-3 py-2.5 text-[13px] leading-relaxed text-ink">
                {item.message}
              </p>
            )}
            {renderActions?.(item)}
          </div>
        </Card>
      ))}
    </div>
  );
}
