import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { IS_DEMO, getDemoMember } from "@/lib/demo";
import { prisma } from "@/lib/db";
import { calcAge, formatSlot } from "@/lib/format";
import {
  RESIDENCE_AREA_LABELS,
  CANCELLATION_NOTICE_SHORT,
  SCHEDULING_RULES,
  PRICING,
} from "@/lib/constants";
import { classifyCancellation, isDateFeeWaived } from "@/lib/scheduling";
import { AppHeader } from "@/components/member/AppHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardBody, SectionTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { MemberFacingPhaseBadge } from "@/components/ui/StatusBadge";
import { CandidateForm } from "@/components/member/scheduling/CandidateForm";
import { CancellationPolicy } from "@/components/member/scheduling/CancellationPolicy";
import {
  IconCalendar,
  IconMapPin,
  IconChevronRight,
  IconCheck,
  IconDoc,
} from "@/components/member/icons";
import {
  proposeCandidates,
  selectCandidate,
  requestReschedule,
  cancelDate,
  dayOfContact,
} from "./actions";

const yen = (n: number) => `${n.toLocaleString("ja-JP")}円`;
const mapUrl = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

// 静的エクスポート（デモ）用：デモ会員が参加するマッチのみ事前生成
export async function generateStaticParams() {
  if (!IS_DEMO) return [];
  const me = await getDemoMember();
  const rows = await prisma.match.findMany({
    where: { OR: [{ applicantId: me.id }, { receiverId: me.id }] },
    select: { id: true },
  });
  return rows.map((r) => ({ id: r.id }));
}

const TITLES = {
  SCHEDULING: "日程調整",
  CONFIRMED: "デートの予定",
  COMPLETED: "デート詳細",
  CANCELLED: "デート詳細",
} as const;

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireMember();

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      applicant: { include: { photos: { orderBy: { order: "asc" }, take: 1 } } },
      receiver: { include: { photos: { orderBy: { order: "asc" }, take: 1 } } },
      dateEvent: { include: { store: true } },
      proposals: {
        orderBy: { round: "desc" },
        include: { candidates: { orderBy: { startAt: "asc" } } },
      },
      surveyResponses: { where: { memberId: me.id }, select: { submittedAt: true } },
    },
  });

  if (
    !match ||
    (match.applicantId !== me.id && match.receiverId !== me.id)
  ) {
    notFound();
  }

  const iAmApplicant = match.applicantId === me.id;
  const other = iAmApplicant ? match.receiver : match.applicant;

  // 最新の提示（round 最大）
  const latestProposal = match.proposals[0];
  const latestProposedByMe =
    latestProposal && latestProposal.proposedById === me.id;
  // まだ誰も候補を提示していない
  const noProposalYet = match.proposals.length === 0;

  // 状態(a): まだ未提示で、相手の提示を自分が出す番か（＝最初は申受側が提示）
  // 申込側=applicant、申受側=receiver。最初の候補提示は申受側が行う想定。
  const isReceiver = !iAmApplicant;
  const showInitialForm = noProposalYet && isReceiver;

  // 状態(b): 相手が最新候補を提示済みで、自分が選ぶ番
  const myTurnToSelect =
    latestProposal && !latestProposedByMe && latestProposal.candidates.length > 0;

  const activePhase = match.phase === "SCHEDULING" || match.phase === "CONFIRMED";
  const fee = isDateFeeWaived(me);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title={TITLES[match.phase]} backHref="/matches" />

      {/* お相手（タップでプロフィールへ） */}
      <Link
        href={`/users/${other.id}`}
        className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3 transition-colors active:bg-surface-alt"
      >
        <Avatar url={other.photos[0]?.url} name={other.nickname} className="h-12 w-12 text-lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-ink">{other.nickname}さん</p>
          <p className="num-tnum truncate text-xs text-ink-soft">
            {calcAge(other.birthDate)}歳・{RESIDENCE_AREA_LABELS[other.residenceArea]}
          </p>
        </div>
        {activePhase && <MemberFacingPhaseBadge phase={match.phase} />}
        <IconChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
      </Link>

      <div className="space-y-5 px-4 py-4 pb-8">
        {match.phase === "SCHEDULING" && (
          <SchedulingView
            matchId={match.id}
            nickname={other.nickname}
            showInitialForm={!!showInitialForm}
            myTurnToSelect={!!myTurnToSelect}
            candidates={myTurnToSelect ? latestProposal.candidates : []}
            myProposal={latestProposedByMe ? latestProposal.candidates : []}
            feeNote={
              fee.waived
                ? `今回のデート代は無料です（${fee.reason}）。`
                : `日程が確定すると、デート代 ${yen(PRICING.DATE_FEE)} を登録済みのカードで決済します。`
            }
          />
        )}

        {match.phase === "CONFIRMED" && match.dateEvent && (
          <ConfirmedView matchId={match.id} event={match.dateEvent} />
        )}

        {match.phase === "COMPLETED" && (
          <div className="space-y-4">
            <Card>
              <CardBody className="flex flex-col items-center py-7 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
                  <IconCheck className="h-6 w-6" />
                </span>
                <p className="mt-3 text-base font-bold text-ink">デートは実施済みです</p>
                {match.dateEvent && (
                  <p className="num-tnum mt-1 text-[13px] text-ink-soft">
                    {formatSlot(match.dateEvent.startAt, match.dateEvent.endAt)}
                    {match.dateEvent.store && `・${match.dateEvent.store.name}`}
                  </p>
                )}
                <p className="mt-2 text-[13px] text-ink-soft">ご利用ありがとうございました。</p>
              </CardBody>
            </Card>
            <Link
              href={`/survey/${match.id}`}
              className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line/80 bg-surface px-4 py-3.5 shadow-[var(--shadow-card)] transition-colors active:bg-surface-alt"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-alt text-ink-soft">
                <IconDoc className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-ink">デート後アンケート</span>
                <span className="block text-xs text-ink-soft">
                  {match.surveyResponses[0]?.submittedAt
                    ? "回答済み・内容の確認と修正ができます"
                    : "ご回答をお願いします（お相手には公開されません）"}
                </span>
              </span>
              <IconChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
            </Link>
          </div>
        )}

        {match.phase === "CANCELLED" && (
          <Card>
            <CardBody>
              <p className="text-sm font-bold text-ink">このマッチは終了しました</p>
              <p className="mt-1 text-xs text-ink-soft">デートはキャンセルされました。</p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

/** SCHEDULING：候補提示 / 候補選択 を状態で出し分ける。 */
function SchedulingView({
  matchId,
  nickname,
  showInitialForm,
  myTurnToSelect,
  candidates,
  myProposal,
  feeNote,
}: {
  matchId: string;
  nickname: string;
  showInitialForm: boolean;
  myTurnToSelect: boolean;
  candidates: { id: string; startAt: Date; endAt: Date }[];
  myProposal: { id: string; startAt: Date; endAt: Date }[];
  feeNote: string;
}) {
  const rules = (
    <p className="mb-3 text-xs leading-relaxed text-ink-soft">
      マッチ成立から{SCHEDULING_RULES.PROPOSAL_WINDOW_DAYS}日以内で、
      {SCHEDULING_RULES.MIN_CANDIDATES}件以上の候補日時をご提示ください。デート時間は
      {SCHEDULING_RULES.DATE_DURATION_MIN}分が目安です。
    </p>
  );

  // (a) 自分が申受側で未提示 → 候補提示フォーム
  if (showInitialForm) {
    return (
      <section>
        <SectionTitle>日程候補を提示する</SectionTitle>
        <Card>
          <CardBody>
            {rules}
            <CandidateForm action={proposeCandidates} matchId={matchId} />
          </CardBody>
        </Card>
      </section>
    );
  }

  // (b) 相手提示の最新候補がある & 自分が選ぶ番
  if (myTurnToSelect) {
    return (
      <div className="space-y-5">
        <section>
          <SectionTitle>{nickname}さんから届いた日程候補</SectionTitle>
          <Card>
            <CardBody className="space-y-3">
              <p className="text-[13px] leading-relaxed text-ink-soft">
                ご都合のよい日時をひとつお選びください。選んだ時点でデート日程が確定します。
              </p>
              <ul className="space-y-2">
                {candidates.map((c) => (
                  <li key={c.id}>
                    <form
                      action={selectCandidate}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3"
                    >
                      <input type="hidden" name="matchId" value={matchId} />
                      <input type="hidden" name="candidateId" value={c.id} />
                      <span className="flex min-w-0 items-center gap-2.5">
                        <IconCalendar className="h-5 w-5 shrink-0 text-ink-faint" />
                        <span className="num-tnum text-[15px] font-bold text-ink">
                          {formatSlot(c.startAt, c.endAt)}
                        </span>
                      </span>
                      <Button type="submit" size="sm" variant="primary" className="shrink-0">
                        確定する
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
              {/* 確定操作の直前に必ず短い注意文と料金を表示 */}
              <p className="rounded-xl bg-warning-soft px-3 py-2.5 text-xs font-bold leading-relaxed text-warning-strong">
                {CANCELLATION_NOTICE_SHORT}
              </p>
              <p className="px-1 text-xs leading-relaxed text-ink-soft">{feeNote}</p>
            </CardBody>
          </Card>
        </section>

        <details className="group rounded-[var(--radius-card)] border border-line/80 bg-surface shadow-[var(--shadow-card)]">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 [&::-webkit-details-marker]:hidden">
            <span>
              <span className="block text-sm font-bold text-ink">都合の合う日時がない場合</span>
              <span className="block text-xs text-ink-soft">あなたから別の候補を提示できます</span>
            </span>
            <IconChevronRight className="h-4 w-4 shrink-0 text-ink-faint transition-transform duration-200 group-open:rotate-90" />
          </summary>
          <div className="details-body border-t border-line px-4 pb-4 pt-3">
            {rules}
            <CandidateForm action={proposeCandidates} matchId={matchId} />
          </div>
        </details>
      </div>
    );
  }

  // 自分が提示済みで相手の選択待ち／相手の提示待ち
  return (
    <Card>
      <CardBody className="py-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-alt text-ink-faint">
          <IconCalendar className="h-6 w-6" />
        </span>
        {myProposal.length > 0 ? (
          <>
            <p className="mt-3 text-sm font-bold text-ink">{nickname}さんの返答をお待ちください</p>
            <p className="mt-1 text-xs text-ink-soft">提示した候補からお相手が選ぶと日程が確定します。</p>
            <ul className="mx-auto mt-4 max-w-xs space-y-1.5 text-left">
              {myProposal.map((c) => (
                <li
                  key={c.id}
                  className="num-tnum rounded-xl bg-surface-alt px-3 py-2 text-[13px] font-bold text-ink"
                >
                  {formatSlot(c.startAt, c.endAt)}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm font-bold text-ink">{nickname}さんからの日程候補をお待ちください</p>
            <p className="mt-1 text-xs text-ink-soft">候補が届くと、通知でお知らせします。</p>
          </>
        )}
      </CardBody>
    </Card>
  );
}

/** CONFIRMED：確定日時・店舗情報・注意事項。変更/キャンセル/当日連絡。 */
function ConfirmedView({
  matchId,
  event,
}: {
  matchId: string;
  event: {
    startAt: Date;
    endAt: Date;
    store: { name: string; address: string; area: string | null; phone: string | null } | null;
    reservationName: string | null;
    notesTemplate: string | null;
  };
}) {
  // 開始24時間前まで日程変更可能
  const canReschedule = classifyCancellation(event.startAt) === "BEFORE_24H";
  // 当日まであと何日か（日本時間の日付で比較）
  const jstDay = (d: Date) => Math.floor((d.getTime() + 9 * 3_600_000) / 86_400_000);
  const daysLeft = jstDay(event.startAt) - jstDay(new Date());

  return (
    <div className="space-y-5">
      {/* 確定日時＋お店（チケット風の1枚にまとめる） */}
      <Card className="overflow-hidden">
        <div className="border-b border-dashed border-line px-4 pb-4 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink-soft">確定した日時</span>
            {daysLeft >= 0 && (
              <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-bold text-primary-strong">
                {daysLeft === 0 ? "今日" : daysLeft === 1 ? "明日" : `あと${daysLeft}日`}
              </span>
            )}
          </div>
          <p className="num-tnum mt-1.5 text-[22px] font-black tracking-tight text-ink">
            {formatSlot(event.startAt, event.endAt)}
          </p>
          <p className="mt-0.5 text-xs text-ink-faint">
            デート時間は{SCHEDULING_RULES.DATE_DURATION_MIN}分が目安です
          </p>
        </div>
        <div className="px-4 py-4">
          <span className="text-xs font-bold text-ink-soft">お店</span>
          {event.store ? (
            <div className="mt-1.5 space-y-1">
              <p className="text-[15px] font-bold text-ink">{event.store.name}</p>
              <p className="flex items-start gap-1 text-[13px] text-ink-soft">
                <IconMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" />
                {event.store.address}
              </p>
              {event.store.phone && (
                <p className="text-[13px] text-ink-soft">TEL：{event.store.phone}</p>
              )}
              {event.reservationName && (
                <p className="text-[13px] text-ink-soft">
                  予約名：<span className="font-bold text-ink">{event.reservationName}</span>
                </p>
              )}
              <a
                href={mapUrl(event.store.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-[13px] font-bold text-ink transition-colors hover:bg-canvas"
              >
                <IconMapPin className="h-4 w-4" />
                地図で見る
              </a>
            </div>
          ) : (
            <p className="mt-1.5 text-sm text-ink-soft">
              お店は運営が確定後にこちらに表示されます。
            </p>
          )}
        </div>
      </Card>

      {/* 注意事項テンプレ */}
      {event.notesTemplate && (
        <section>
          <SectionTitle>当日の注意事項</SectionTitle>
          <Card>
            <CardBody>
              <ul className="space-y-1.5">
                {event.notesTemplate.split("\n").filter(Boolean).map((line) => (
                  <li key={line} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
                    <IconCheck className="mt-[3px] h-3.5 w-3.5 shrink-0 text-success" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </section>
      )}

      {/* 当日連絡 */}
      <section>
        <SectionTitle>当日のご連絡</SectionTitle>
        <Card>
          <CardBody>
            <form action={dayOfContact} className="space-y-3">
              <input type="hidden" name="matchId" value={matchId} />
              <Field label="メッセージ" hint="遅れる場合や待ち合わせのご連絡にお使いください。">
                <Textarea
                  name="message"
                  rows={3}
                  placeholder="例：5分ほど遅れそうです。お席でお待ちください。"
                  required
                />
              </Field>
              <Button type="submit" variant="secondary" size="md" className="w-full">
                当日連絡を送る
              </Button>
            </form>
          </CardBody>
        </Card>
      </section>

      {/* 日程変更・キャンセル（誤操作を防ぐため折りたたみ） */}
      <section className="space-y-2">
        <SectionTitle>予定の変更・キャンセル</SectionTitle>

        <details className="group rounded-[var(--radius-card)] border border-line/80 bg-surface shadow-[var(--shadow-card)]">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 text-sm font-bold text-ink [&::-webkit-details-marker]:hidden">
            日程を変更したい
            <IconChevronRight className="h-4 w-4 text-ink-faint transition-transform duration-200 group-open:rotate-90" />
          </summary>
          <div className="details-body border-t border-line px-4 pb-4 pt-3">
            {canReschedule ? (
              <form action={requestReschedule}>
                <input type="hidden" name="matchId" value={matchId} />
                <p className="mb-3 text-xs leading-relaxed text-ink-soft">
                  開始{SCHEDULING_RULES.RESCHEDULE_CUTOFF_HOURS}
                  時間前まで日程変更を希望できます。日程調整中に戻り、改めて候補を提示できます。
                </p>
                <Button type="submit" variant="outline" size="md" className="w-full">
                  日程変更を希望する
                </Button>
              </form>
            ) : (
              <p className="text-xs leading-relaxed text-ink-soft">
                開始{SCHEDULING_RULES.RESCHEDULE_CUTOFF_HOURS}
                時間前を過ぎたため、日程変更はできません。やむを得ない場合はキャンセルをご検討ください。
              </p>
            )}
          </div>
        </details>

        {/* デートキャンセル（開いたときにポリシー全文＋同意を必ず表示） */}
        <details className="group rounded-[var(--radius-card)] border border-line/80 bg-surface shadow-[var(--shadow-card)]">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 text-sm font-bold text-danger [&::-webkit-details-marker]:hidden">
            デートをキャンセルする
            <IconChevronRight className="h-4 w-4 text-ink-faint transition-transform duration-200 group-open:rotate-90" />
          </summary>
          <div className="details-body space-y-3 border-t border-line px-4 pb-4 pt-3">
            <div className="rounded-xl bg-warning-soft px-3 py-2 text-xs font-bold leading-relaxed text-warning-strong">
              {CANCELLATION_NOTICE_SHORT}
            </div>
            <CancellationPolicy />
            <form action={cancelDate} className="space-y-3 pt-1">
              <input type="hidden" name="matchId" value={matchId} />
              <Field label="キャンセル理由" hint="運営が状況を確認します。">
                <Textarea
                  name="reason"
                  rows={3}
                  placeholder="キャンセルの理由をご記入ください。"
                  required
                />
              </Field>
              <label className="flex items-start gap-2 text-xs leading-relaxed text-ink-soft">
                <input
                  type="checkbox"
                  name="agree"
                  value="1"
                  required
                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                />
                <span>上記のキャンセルポリシー（返金・違約金・警告）に同意します。</span>
              </label>
              <Button type="submit" variant="danger" size="lg">
                同意してキャンセルする
              </Button>
            </form>
          </div>
        </details>
      </section>
    </div>
  );
}
