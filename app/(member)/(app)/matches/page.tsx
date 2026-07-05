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
          style={{ animationDelay: "80ms" }}
          className="animate-fade-up flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:bg-canvas active:scale-[0.99]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-alt text-ink-soft">
            <IconCoffee className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <span className="inline-flex items-center rounded-full bg-surface-alt px-2 py-0.5 text-[11px] font-bold text-ink-soft">
              提携カフェ
            </span>
            <p className="mt-1 text-[15px] font-bold text-ink">札幌おすすめカフェ</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
              サツコイ！提携カフェなら安心・快適なデートが楽しめます
            </p>
            <p className="mt-2 text-[13px] font-bold text-primary">提携カフェ一覧 →</p>
          </div>
        </a>

        <a
          href="#"
          style={{ animationDelay: "160ms" }}
          className="animate-fade-up flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:bg-canvas active:scale-[0.99]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-alt text-ink-soft">
            <IconScissors className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <span className="inline-flex items-center rounded-full bg-surface-alt px-2 py-0.5 text-[11px] font-bold text-ink-soft">
              提携サロン
            </span>
            <p className="mt-1 text-[15px] font-bold text-ink">ビューティーサロンLUXE札幌</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
              デート前のヘアセット・メイク20%OFF！サツコイ会員様限定特典
            </p>
            <p className="mt-2 text-[13px] font-bold text-primary">クーポンを見る →</p>
          </div>
        </a>
      </div>
    </div>
  );
}
