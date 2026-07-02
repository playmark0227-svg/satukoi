import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fromNow, formatDate } from "@/lib/format";
import { NOTIFICATION_TYPE_LABELS } from "@/lib/constants";
import { AppHeader } from "@/components/member/AppHeader";
import { Card, CardBody, SectionTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { AnnouncementTarget } from "@prisma/client";
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

      <div className="space-y-4 px-4 py-4">
        {/* 通知一覧 */}
        <div>
          <SectionTitle>通知</SectionTitle>
          {notifications.length === 0 ? (
            <Card>
              <EmptyState
                icon="🔔"
                title="お知らせはありません"
                description="新しい通知が届くとここに表示されます。"
              />
            </Card>
          ) : (
            <div className="stagger space-y-2">
              {notifications.map((n) => {
                const unread = n.readAt === null;
                return (
                  <Card
                    key={n.id}
                    className={unread ? "border-primary-soft bg-primary-tint/40" : ""}
                  >
                    <CardBody className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {unread && (
                            <span className="animate-pulse-ring h-2 w-2 shrink-0 rounded-full bg-primary" />
                          )}
                          <Badge tone={unread ? "primary" : "neutral"}>
                            {NOTIFICATION_TYPE_LABELS[n.type]}
                          </Badge>
                        </div>
                        <span className="shrink-0 text-xs text-ink-faint">
                          {fromNow(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-ink">{n.title}</p>
                      <p className="text-sm leading-relaxed text-ink-soft">
                        {n.body}
                      </p>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* 運営からのお知らせ */}
        {announcements.length > 0 && (
          <div>
            <SectionTitle>運営からのお知らせ</SectionTitle>
            <div className="stagger space-y-2">
              {announcements.map((a) => (
                <Card key={a.id}>
                  <CardBody className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone="info">運営からのお知らせ</Badge>
                      {a.publishedAt && (
                        <span className="shrink-0 text-xs text-ink-faint">
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
          </div>
        )}
      </div>
    </div>
  );
}

