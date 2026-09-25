import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcAge, formatSlot } from "@/lib/format";
import { RESIDENCE_AREA_LABELS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { BrandHeader } from "@/components/member/BrandHeader";
import { SegmentTabs } from "@/components/member/matches/SegmentTabs";
import { Avatar } from "@/components/ui/Avatar";
import { IconCoffee, IconScissors, IconChevronRight, IconCalendar } from "@/components/member/icons";

type MatchItem = {
  id: string;
  nickname: string;
  age: number;
  area: string;
  photoUrl: string | null;
  status: string;
  /** あなたの操作が必要／予定が近いなど、目立たせたいもの */
  highlight: boolean;
};

/** マッチ（Instagram の DM 一覧のような画面）：日程調整中／日程確定をタブで表示。 */
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
    let highlight = false;
    const lastProposal = m.proposals[m.proposals.length - 1];
    if (m.phase === "SCHEDULING" && lastProposal) {
      if (lastProposal.proposedById === me.id) {
        status = "お相手の日程選択待ち";
      } else {
        status = "日程候補が届いています";
        highlight = true;
      }
    } else if (m.phase === "SCHEDULING" && m.receiverId === me.id) {
      status = "日程候補を提示してください";
      highlight = true;
    } else if (m.phase === "SCHEDULING") {
      status = "お相手からの日程候補待ち";
    } else if (m.phase === "CONFIRMED" && m.dateEvent) {
      status = `デート ${formatSlot(m.dateEvent.startAt, m.dateEvent.endAt)}`;
      highlight = true;
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
      highlight,
    };
  };

  const scheduling = matches.filter((m) => m.phase === "SCHEDULING").map(toItem);
  const confirmed = matches
    .filter((m) => m.phase === "CONFIRMED" || m.phase === "COMPLETED")
    .map(toItem);

  return (
    <div className="flex flex-1 flex-col">
      <BrandHeader
        title="マッチ"
        right={
          <Link href="/applications" className="text-sm font-semibold text-primary active:opacity-60">
            お申込み{pendingReceived > 0 && <span className="num-tnum">（{pendingReceived}）</span>}
          </Link>
        }
      />

      {pendingReceived > 0 && (
        <Link
          href="/applications"
          className="mx-4 mb-2 flex items-center gap-3 rounded-xl bg-[#fafafa] px-3.5 py-3 active:bg-surface-alt"
        >
          <span className="num-tnum flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-like text-sm font-bold text-white">
            {pendingReceived}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-ink">デートのお申込みが届いています</span>
            <span className="block text-xs text-ink-soft">承諾するとマッチ成立です</span>
          </span>
          <IconChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
        </Link>
      )}

      <SegmentTabs
        segments={[
          {
            key: "scheduling",
            label: "日程調整中",
            badge: scheduling.filter((c) => c.highlight).length,
            count: scheduling.length,
            content: <MatchList items={scheduling} />,
          },
          {
            key: "confirmed",
            label: "日程確定",
            badge: confirmed.filter((c) => c.highlight).length,
            count: confirmed.length,
            content: <MatchList items={confirmed} />,
          },
        ]}
      />

      {/* 提携パートナーのご案内 */}
      <section className="mt-2 border-t border-line-soft px-4 pb-8 pt-4">
        <h2 className="pb-2 text-[15px] font-bold text-ink">デートをもっと快適に</h2>
        <div className="divide-y divide-line-soft">
          <PartnerRow
            href="/partners"
            icon={<IconCoffee className="h-5 w-5" />}
            title="札幌のデート向け提携カフェ"
            body="お席を予約済み。安心して待ち合わせできます"
          />
          <PartnerRow
            href="/partners#salon"
            icon={<IconScissors className="h-5 w-5" />}
            title="ビューティーサロンLUXE札幌"
            body="デート前のヘアセット・メイクが20%OFF"
          />
        </div>
      </section>
    </div>
  );
}

function MatchList({ items }: { items: MatchItem[] }) {
  if (items.length === 0) {
    return (
      <div className="px-8 py-14 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink text-ink">
          <IconCalendar className="h-7 w-7" />
        </span>
        <p className="mt-4 text-lg font-bold text-ink">まだやりとりはありません</p>
        <p className="mt-1 text-sm text-ink-soft">ホームから気になる方にデートを申し込んでみましょう。</p>
      </div>
    );
  }
  return (
    <ul className="stagger py-2">
      {items.map((it) => (
        <li key={it.id}>
          <Link
            href={`/matches/${it.id}`}
            className="flex items-center gap-3 px-4 py-2.5 transition-colors active:bg-surface-alt"
          >
            <span className={it.highlight ? "story-ring" : "story-ring-seen"}>
              <Avatar url={it.photoUrl} name={it.nickname} className="h-[52px] w-[52px] text-lg" />
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("truncate text-[15px] text-ink", it.highlight ? "font-bold" : "font-medium")}>
                {it.nickname}
                <span className="num-tnum ml-1.5 text-xs font-normal text-ink-soft">
                  {it.age}歳・{it.area}
                </span>
              </p>
              <p
                className={cn(
                  "num-tnum mt-0.5 truncate text-[13px]",
                  it.highlight ? "font-semibold text-ink" : "text-ink-soft"
                )}
              >
                {it.status}
              </p>
            </div>
            {it.highlight && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="要確認" />}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function PartnerRow({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 py-3 active:opacity-70">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line text-ink">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{title}</span>
        <span className="block truncate text-xs text-ink-soft">{body}</span>
      </span>
      <IconChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
    </Link>
  );
}
