import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcAge, fromNow } from "@/lib/format";
import {
  RESIDENCE_AREA_LABELS,
  APPLICATION_STATUS_LABELS,
} from "@/lib/constants";
import { AppHeader } from "@/components/member/AppHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Badge, type Tone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { ApplicationStatus } from "@prisma/client";

const statusTone: Record<ApplicationStatus, Tone> = {
  PENDING: "warning",
  ACCEPTED: "success",
  DECLINED: "neutral",
  CANCELLED: "neutral",
  EXPIRED: "neutral",
};

/**
 * お申込み：送った申込 / 受け取った申込 をタブで切り替えて一覧表示。
 * searchParams.tab = "sent" | "received"（既定 received）。
 */
export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const me = await requireMember();
  const sp = await searchParams;
  const tab = sp.tab === "sent" ? "sent" : "received";

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

  const list =
    tab === "sent"
      ? sent.map((a) => ({
          id: a.id,
          other: a.receiver,
          status: a.status,
          message: a.message,
          createdAt: a.createdAt,
        }))
      : received.map((a) => ({
          id: a.id,
          other: a.applicant,
          status: a.status,
          message: a.message,
          createdAt: a.createdAt,
        }));

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="お申込み" />

      {/* タブ */}
      <div className="grid grid-cols-2 border-b border-line bg-surface">
        <TabLink href="/applications?tab=received" active={tab === "received"}>
          受け取った申込（{received.length}）
        </TabLink>
        <TabLink href="/applications?tab=sent" active={tab === "sent"}>
          送った申込（{sent.length}）
        </TabLink>
      </div>

      <div className="px-4 py-4">
        {list.length === 0 ? (
          <EmptyState
            title={
              tab === "sent"
                ? "送ったお申込みはありません"
                : "受け取ったお申込みはありません"
            }
            description={
              tab === "sent"
                ? "気になるお相手にデートを申し込んでみましょう。"
                : "お相手からのお申込みがここに表示されます。"
            }
            action={
              tab === "sent" ? (
                <ButtonLink href="/users" size="md">
                  お相手をさがす
                </ButtonLink>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {list.map((item) => (
              <Card key={item.id}>
                <div className="flex items-center gap-3 p-3">
                  <Link
                    href={`/users/${item.other.id}`}
                    className="shrink-0"
                  >
                    <Avatar
                      url={item.other.photos[0]?.url}
                      name={item.other.nickname}
                      rounded="xl"
                      className="h-14 w-14 text-xl"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-ink">
                        {item.other.nickname}
                      </p>
                      <Badge tone={statusTone[item.status]}>
                        {APPLICATION_STATUS_LABELS[item.status]}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink-soft">
                      {calcAge(item.other.birthDate)}歳・
                      {RESIDENCE_AREA_LABELS[item.other.residenceArea]}
                    </p>
                    {item.message && (
                      <p className="mt-1 line-clamp-2 text-xs text-ink-soft">
                        「{item.message}」
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-ink-faint">
                      {fromNow(item.createdAt)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-center border-b-2 py-3 text-sm font-bold transition",
        active
          ? "border-primary text-primary-strong"
          : "border-transparent text-ink-faint"
      )}
    >
      {children}
    </Link>
  );
}

