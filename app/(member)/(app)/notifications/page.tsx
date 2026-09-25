import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fromNow, formatDate } from "@/lib/format";
import { AppHeader } from "@/components/member/AppHeader";
import { BrandMark } from "@/components/member/BrandMark";
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

/** 通知日時を「今日／今週／今月／それ以前」に分類（日本時間の日付で判定） */
function periodLabel(d: Date) {
  const day = (t: number) => Math.floor((t + 9 * 3_600_000) / 86_400_000);
  const diff = day(Date.now()) - day(d.getTime());
  if (diff <= 0) return "今日";
  if (diff < 7) return "今週";
  if (diff < 30) return "今月";
  return "それ以前";
}

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

  // Instagram のアクティビティのように期間でまとめる
  const groups = new Map<string, typeof notifications>();
  for (const n of notifications) {
    const key = periodLabel(n.createdAt);
    groups.set(key, [...(groups.get(key) ?? []), n]);
  }

  return (
    <div className="flex flex-1 flex-col pb-10">
      <AppHeader
        title="お知らせ"
        backHref="/users"
        right={
          hasUnread ? (
            <form action={markAllRead}>
              <button type="submit" className="text-[13px] font-semibold text-primary active:opacity-60">
                すべて既読
              </button>
            </form>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={<IconBell className="h-6 w-6 text-ink" />}
          title="お知らせはありません"
          description="新しい通知が届くとここに表示されます。"
        />
      ) : (
        [...groups.entries()].map(([label, items]) => (
          <section key={label} className="border-b border-line-soft pb-2 pt-3">
            <h2 className="px-4 pb-1 text-base font-bold text-ink">{label}</h2>
            <ul className="stagger">
              {items.map((n) => {
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
                    <span className={unread ? "story-ring shrink-0" : "story-ring-seen shrink-0"}>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink">
                        <Icon className="h-5 w-5" />
                      </span>
                    </span>
                    <span className="min-w-0 flex-1 text-sm leading-snug text-ink">
                      <span className="font-semibold">{n.title}</span>
                      <span className="text-ink"> {n.body}</span>
                      <span className="num-tnum whitespace-nowrap text-ink-soft"> {fromNow(n.createdAt)}</span>
                    </span>
                    {href && unread && (
                      <span className="shrink-0 rounded-lg bg-primary px-3.5 py-1.5 text-[13px] font-semibold text-white">
                        確認
                      </span>
                    )}
                  </>
                );
                return (
                  <li key={n.id}>
                    {href ? (
                      <Link href={href} className="flex items-center gap-3 px-4 py-2.5 active:bg-surface-alt">
                        {body}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-2.5">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      {/* 運営からのお知らせ */}
      {announcements.length > 0 && (
        <section className="pt-3">
          <h2 className="px-4 pb-1 text-base font-bold text-ink">運営からのお知らせ</h2>
          <ul>
            {announcements.map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-4 py-2.5">
                <span className="story-ring-seen shrink-0 self-start">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface">
                    <BrandMark className="h-6 w-6" />
                  </span>
                </span>
                <span className="min-w-0 flex-1 text-sm leading-snug text-ink">
                  <span className="font-semibold">{a.title}</span>
                  <span className="whitespace-pre-wrap"> {a.body}</span>
                  {a.publishedAt && (
                    <span className="num-tnum whitespace-nowrap text-ink-soft"> {formatDate(a.publishedAt)}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
