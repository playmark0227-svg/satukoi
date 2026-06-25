import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcAge, formatSlot } from "@/lib/format";
import { RESIDENCE_AREA_LABELS } from "@/lib/constants";
import { BrandHeader } from "@/components/member/BrandHeader";
import { MatchTabs, type MatchItem } from "@/components/member/matches/MatchTabs";
import { IconCoffee, IconScissors } from "@/components/member/icons";

/** マッチ：日程調整中／日程確定のタブで自分のやりとりを表示。 */
export default async function MatchesPage() {
  const me = await requireMember();

  const matches = await prisma.match.findMany({
    where: { OR: [{ applicantId: me.id }, { receiverId: me.id }] },
    include: {
      applicant: { include: { photos: { orderBy: { order: "asc" }, take: 1 } } },
      receiver: { include: { photos: { orderBy: { order: "asc" }, take: 1 } } },
      dateEvent: true,
      proposals: { select: { id: true } },
    },
    orderBy: { lastActionAt: "desc" },
  });

  const toItem = (m: (typeof matches)[number]): MatchItem => {
    const other = m.applicantId === me.id ? m.receiver : m.applicant;
    let status = "日程を調整しましょう";
    let statusTone: "primary" | "muted" = "muted";
    if (m.phase === "SCHEDULING" && m.proposals.length > 0) {
      status = "日程候補が届いています";
      statusTone = "primary";
    } else if (m.phase === "CONFIRMED" && m.dateEvent) {
      status = formatSlot(m.dateEvent.startAt, m.dateEvent.endAt);
      statusTone = "primary";
    } else if (m.phase === "COMPLETED") {
      status = "デート実施済";
      statusTone = "muted";
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
      <MatchTabs scheduling={scheduling} confirmed={confirmed} />

      {/* 提携パートナーのご案内 */}
      <div className="space-y-3 px-4 pb-6 pt-1">
        <a
          href="#"
          className="flex items-start gap-3 rounded-3xl border border-warning/30 bg-warning-soft p-4"
        >
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{ background: "linear-gradient(135deg,#fb923c,#f97316)" }}
          >
            <IconCoffee className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <span className="inline-block rounded-full bg-warning px-2.5 py-0.5 text-[11px] font-bold text-white">
              提携カフェ
            </span>
            <p className="mt-1 font-bold text-ink">札幌おすすめカフェ</p>
            <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">
              サツコイ！提携カフェなら安心・快適なデートが楽しめます
            </p>
            <p className="mt-1.5 text-sm font-bold text-warning">提携カフェ一覧 →</p>
          </div>
        </a>

        <a
          href="#"
          className="flex items-start gap-3 rounded-3xl border border-success/30 bg-success-soft p-4"
        >
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{ background: "linear-gradient(135deg,#34d399,#10b981)" }}
          >
            <IconScissors className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <span className="inline-block rounded-full bg-success px-2.5 py-0.5 text-[11px] font-bold text-white">
              提携サロン
            </span>
            <p className="mt-1 font-bold text-ink">ビューティーサロンLUXE札幌</p>
            <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">
              デート前のヘアセット・メイク20%OFF！サツコイ会員様限定特典
            </p>
            <p className="mt-1.5 text-sm font-bold text-success">クーポンを見る →</p>
          </div>
        </a>
      </div>
    </div>
  );
}
