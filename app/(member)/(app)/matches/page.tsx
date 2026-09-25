import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcAge, formatSlot } from "@/lib/format";
import { RESIDENCE_AREA_LABELS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { BrandHeader } from "@/components/member/BrandHeader";
import { SegmentTabs } from "@/components/member/matches/SegmentTabs";
import { Avatar } from "@/components/ui/Avatar";
import {
  IconCoffee,
  IconScissors,
  IconChevronRight,
  IconCalendar,
} from "@/components/member/icons";

type MatchItem = {
  id: string;
  nickname: string;
  age: number;
  area: string;
  photoUrl: string | null;
  status: string;
  statusTone: "primary" | "muted";
};

/** マッチ：日程調整中／日程確定のタブで自分のやりとりを表示。 */
export default async function MatchesPage() {
  const me = await requireMember();

  const [matches, pendingReceived] = await Promise.all([
    prisma.match.findMany({
      where: { OR: [{ applicantId: me.id }, { receiverId: me.id }] },
      include: {
        applicant: { include: { photos: { orderBy: { order: "asc" }, take: 1 } } },
        receiver: { include: { photos: { orderBy: { order: "asc" }, take: 1 } } },
        dateEvent: true,
        proposals: { select: { id: true, proposedById: true }, orderBy: { round: "asc" } },
      },
      orderBy: { lastActionAt: "desc" },
    }),
    prisma.dateApplication.count({ where: { receiverId: me.id, status: "PENDING" } }),
  ]);

  const toItem = (m: (typeof matches)[number]): MatchItem => {
    const other = m.applicantId === me.id ? m.receiver : m.applicant;
    let status = "日程を調整しましょう";
    let statusTone: "primary" | "muted" = "muted";
    const lastProposal = m.proposals[m.proposals.length - 1];
    if (m.phase === "SCHEDULING" && lastProposal) {
      if (lastProposal.proposedById === me.id) {
        status = "お相手の日程選択待ち";
      } else {
        status = "日程候補が届いています";
        statusTone = "primary";
      }
    } else if (m.phase === "SCHEDULING" && m.receiverId === me.id) {
      status = "日程候補を提示してください";
      statusTone = "primary";
    } else if (m.phase === "SCHEDULING") {
      status = "お相手からの日程候補待ち";
    } else if (m.phase === "CONFIRMED" && m.dateEvent) {
      status = formatSlot(m.dateEvent.startAt, m.dateEvent.endAt);
      statusTone = "primary";
    } else if (m.phase === "COMPLETED") {
      status = "デート実施済み";
    }
    return {
      id: m.id,
      nickname: other.nickname,
      age: calcAge(other.birthDate),
      area: RESIDENCE_AREA_LABELS[other.residenceArea],
      photoUrl: other.photos[0]?.url ?? null,
      status,
      statusTone,
    };
  };

  const scheduling = matches.filter((m) => m.phase === "SCHEDULING").map(toItem);
  const confirmed = matches
    .filter((m) => m.phase === "CONFIRMED" || m.phase === "COMPLETED")
    .map(toItem);

  return (
    <div className="flex flex-1 flex-col">
      <BrandHeader />

      <SegmentTabs
        segments={[
          {
            key: "scheduling",
            label: "日程調整中",
            badge: scheduling.length,
            content: <MatchList items={scheduling} pendingReceived={pendingReceived} />,
          },
          {
            key: "confirmed",
            label: "日程確定",
            badge: confirmed.filter((c) => c.statusTone === "primary").length,
            content: <MatchList items={confirmed} pendingReceived={pendingReceived} />,
          },
        ]}
      />

      {/* 提携パートナーのご案内 */}
      <div className="space-y-3 px-4 pb-6">
        <h2 className="px-1 pt-2 text-sm font-bold text-ink-soft">デートをもっと快適に</h2>
        <PartnerCard
          href="/partners"
          icon={<IconCoffee className="h-5 w-5" />}
          tag="提携カフェ"
          title="札幌のデート向けカフェ"
          body="サツコイ！の提携カフェなら、お席を予約済み。安心して待ち合わせできます。"
          cta="提携カフェ一覧"
        />
        <PartnerCard
          href="/partners#salon"
          icon={<IconScissors className="h-5 w-5" />}
          tag="提携サロン"
          title="ビューティーサロンLUXE札幌"
          body="デート前のヘアセット・メイクが20%OFF。サツコイ会員さま限定の特典です。"
          cta="特典を見る"
        />
      </div>
    </div>
  );
}

function MatchList({ items, pendingReceived }: { items: MatchItem[]; pendingReceived: number }) {
  return (
    <div className="space-y-3 px-4 py-4">
      {pendingReceived > 0 && (
        <Link
          href="/applications"
          className="animate-fade-up flex items-center gap-3 rounded-[var(--radius-card)] border border-primary/25 bg-primary-tint px-4 py-3 transition-colors active:bg-primary-soft"
        >
          <span className="num-tnum flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
            {pendingReceived}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-ink">デートのお申込みが届いています</span>
            <span className="block text-xs text-ink-soft">承諾するとマッチ成立です</span>
          </span>
          <IconChevronRight className="h-4 w-4 shrink-0 text-primary-strong" />
        </Link>
      )}

      {items.length === 0 ? (
        <div className="animate-fade-up rounded-[var(--radius-card)] border border-line bg-surface px-6 py-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-alt text-ink-faint">
            <IconCalendar className="h-6 w-6" />
          </span>
          <p className="mt-3 text-sm font-bold text-ink">まだやりとりはありません</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">
            ホームから気になる方にデートを申し込んでみましょう。
          </p>
        </div>
      ) : (
        <ul className="stagger divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line/80 bg-surface shadow-[var(--shadow-card)]">
          {items.map((it) => (
            <li key={it.id}>
              <Link
                href={`/matches/${it.id}`}
                className="group flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-canvas active:bg-surface-alt"
              >
                {/* 要対応（日程候補が届いた・予定が近い）はグラデーションの輪で目立たせる */}
                <span className={it.statusTone === "primary" ? "story-ring" : "story-ring-seen"}>
                  <Avatar url={it.photoUrl} name={it.nickname} className="h-[52px] w-[52px] text-lg" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold text-ink">{it.nickname}</p>
                  <p className="num-tnum text-[13px] text-ink-soft">
                    {it.age}歳・{it.area}
                  </p>
                  <p
                    className={cn(
                      "num-tnum mt-0.5 truncate text-[13px] font-bold",
                      it.statusTone === "primary" ? "text-primary-strong" : "text-ink-faint"
                    )}
                  >
                    {it.status}
                  </p>
                </div>
                <IconChevronRight className="h-4 w-4 shrink-0 text-ink-faint transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PartnerCard({
  href,
  icon,
  tag,
  title,
  body,
  cta,
}: {
  href: string;
  icon: React.ReactNode;
  tag: string;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-[var(--radius-card)] border border-line/80 bg-surface p-4 shadow-[var(--shadow-card)] transition-colors hover:bg-canvas active:scale-[0.99]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-alt text-ink-soft">
        {icon}
      </span>
      <div className="min-w-0">
        <span className="inline-flex items-center rounded-full bg-surface-alt px-2 py-0.5 text-[11px] font-bold text-ink-soft">
          {tag}
        </span>
        <p className="mt-1 text-[15px] font-bold text-ink">{title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{body}</p>
        <p className="mt-2 inline-flex items-center gap-0.5 text-[13px] font-bold text-primary-strong">
          {cta}
          <IconChevronRight className="h-3.5 w-3.5" />
        </p>
      </div>
    </Link>
  );
}
