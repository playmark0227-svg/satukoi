import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fromNow, formatDate } from "@/lib/format";
import { AppHeader } from "@/components/member/AppHeader";
import { Card, CardBody, SectionTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";
import {
  IconBell,
  IconCalendar,
  IconChat,
  IconCheck,
  IconHeart,
  IconSend,
} from "@/components/member/icons";
import type { AnnouncementTarget, NotificationType } from "@prisma/client";

const TYPE_ICON: Record<NotificationType, (p: { className?: string }) => React.ReactNode> = {
  APPLICATION_RECEIVED: IconSend,
  MATCHED: IconHeart,
  CANDIDATE_RECEIVED: IconCalendar,
  DATE_CONFIRMED: IconCheck,
  DAY_OF_CONTACT: IconChat,
  DATE_CANCELLED: IconCalendar,
  RESCHEDULE_REQUEST: IconCalendar,
  ADMIN_ANNOUNCEMENT: IconBell,
};
import { markAllRead } from "./actions";

export default async function NotificationsPage() {
  const me = await requireMember();

  const notifications = await prisma.notification.findMany({
    where: { memberId: me.id },
    orderBy: { createdAt: "desc" },
  });

  // 公開済みで、対象が自分の性別 or 全員のお知らせ
  const targets: AnnouncementTarget[] = ["ALL", me.sex];
  const announcements = await prisma.announcement.findMany({
    where: {
      isPublished: true,
      target: { in: targets },
    },
    orderBy: { publishedAt: "desc" },
  });

  const hasUnread = notifications.some((n) => n.readAt === null);

  return (
    <div className="flex flex-1 flex-col pb-10">
      <AppHeader
        title="お知らせ"
        backHref="/users"
        right={
          hasUnread ? (
            <form action={markAllRead}>
              <Button type="submit" variant="ghost" size="sm" className="px-2 text-xs">
                すべて既読
              </Button>
            </form>
          ) : undefined
        }
      />

      <div className="space-y-5 px-4 py-4">
        {/* 通知一覧（タップで該当画面へ） */}
        <section>
          <SectionTitle>通知</SectionTitle>
          {notifications.length === 0 ? (
            <Card>
              <EmptyState
                icon={<IconBell className="h-6 w-6 text-ink-faint" />}
                title="お知らせはありません"
                description="新しい通知が届くとここに表示されます。"
              />
            </Card>
          ) : (
            <ul className="stagger divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line/80 bg-surface shadow-[var(--shadow-card)]">
              {notifications.map((n) => {
                const unread = n.readAt === null;
                const href =
                  n.type === "APPLICATION_RECEIVED"
                    ? "/applications"
                    : n.matchId
                      ? `/matches/${n.matchId}`
                      : null;
                const Icon = TYPE_ICON[n.type];
                const body = (
                  <>
                    <span
                      className={
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full " +
                        (unread ? "bg-primary-soft text-primary-strong" : "bg-surface-alt text-ink-faint")
                      }
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className={"text-sm text-ink " + (unread ? "font-bold" : "font-medium")}>
                          {n.title}
                        </span>
                        <span className="num-tnum mt-0.5 flex shrink-0 items-center gap-1.5 text-[11px] text-ink-faint">
                          {fromNow(n.createdAt)}
                          {unread && (
                            <span className="h-2 w-2 rounded-full bg-primary" aria-label="未読" />
                          )}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-soft">
                        {n.body}
                      </span>
                    </span>
                  </>
                );
                return (
                  <li key={n.id}>
                    {href ? (
                      <Link
                        href={href}
                        className="flex gap-3 px-4 py-3.5 transition-colors hover:bg-canvas active:bg-surface-alt"
                      >
                        {body}
                      </Link>
                    ) : (
                      <div className="flex gap-3 px-4 py-3.5">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* 運営からのお知らせ */}
        {announcements.length > 0 && (
          <section>
            <SectionTitle>運営からのお知らせ</SectionTitle>
            <div className="stagger space-y-2">
              {announcements.map((a) => (
                <Card key={a.id}>
                  <CardBody className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone="info">お知らせ</Badge>
                      {a.publishedAt && (
                        <span className="num-tnum shrink-0 text-[11px] text-ink-faint">
                          {formatDate(a.publishedAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-ink">{a.title}</p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
                      {a.body}
                    </p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

