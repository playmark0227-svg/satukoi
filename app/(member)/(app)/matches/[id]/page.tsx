import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { IS_DEMO, getDemoMember } from "@/lib/demo";
import { prisma } from "@/lib/db";
import { calcAge, formatSlot, formatDateTime } from "@/lib/format";
import {
  RESIDENCE_AREA_LABELS,
  CANCELLATION_NOTICE_SHORT,
  SCHEDULING_RULES,
} from "@/lib/constants";
import { classifyCancellation } from "@/lib/scheduling";
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
  proposeCandidates,
  selectCandidate,
  requestReschedule,
  cancelDate,
  dayOfContact,
} from "./actions";

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

  const headerSub = (
    <div className="flex items-center gap-2 px-4 py-3">
      <Avatar
        url={other.photos[0]?.url}
        name={other.nickname}
        rounded="xl"
        className="h-12 w-12 shrink-0 text-lg"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-ink">{other.nickname}</p>
        <p className="truncate text-xs text-ink-soft">
          {calcAge(other.birthDate)}歳・
          {RESIDENCE_AREA_LABELS[other.residenceArea]}
        </p>
      </div>
      <MemberFacingPhaseBadge phase={match.phase} />
    </div>
  );

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="日程調整" backHref="/matches" />
      <div className="border-b border-line bg-surface">{headerSub}</div>

      <div className="px-4 py-4 space-y-5">
        {match.phase === "SCHEDULING" && (
          <SchedulingView
            matchId={match.id}
            showInitialForm={!!showInitialForm}
            myTurnToSelect={!!myTurnToSelect}
            candidates={
              myTurnToSelect ? latestProposal.candidates : []
            }
          />
        )}

        {match.phase === "CONFIRMED" && match.dateEvent && (
          <ConfirmedView
            matchId={match.id}
            event={match.dateEvent}
          />
        )}

        {match.phase === "COMPLETED" && (
          <Card>
            <CardBody>
              <p className="text-sm font-bold text-ink">デートは実施済みです</p>
              <p className="mt-1 text-xs text-ink-soft">
                ご利用ありがとうございました。
              </p>
            </CardBody>
          </Card>
        )}

        {match.phase === "CANCELLED" && (
          <Card>
            <CardBody>
              <p className="text-sm font-bold text-ink">
                このマッチは終了しました
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                デートはキャンセルされました。
              </p>
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
  showInitialForm,
  myTurnToSelect,
  candidates,
}: {
  matchId: string;
  showInitialForm: boolean;
  myTurnToSelect: boolean;
  candidates: { id: string; startAt: Date; endAt: Date }[];
}) {
  // (a) 自分が申受側で未提示 → 候補提示フォーム
  if (showInitialForm) {
    return (
      <section>
        <SectionTitle>日程候補を提示する</SectionTitle>
        <Card>
          <CardBody>
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
          <SectionTitle>届いた日程候補から選ぶ</SectionTitle>
          <p className="mb-2 px-1 text-xs text-ink-soft">
            ご都合のよい日時をひとつお選びください。選択するとデート日程が確定します。
          </p>
          <Card>
            <CardBody className="space-y-3">
              {/* 確定操作の直前に必ず短い注意文を表示 */}
              <div className="rounded-xl bg-warning-soft px-3 py-2 text-xs font-bold text-warning">
                {CANCELLATION_NOTICE_SHORT}
              </div>
              <div className="space-y-2">
                {candidates.map((c) => (
                  <form
                    key={c.id}
                    action={selectCandidate}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-canvas p-3"
                  >
                    <input type="hidden" name="matchId" value={matchId} />
                    <input type="hidden" name="candidateId" value={c.id} />
                    <span className="text-sm font-bold text-ink">
                      {formatSlot(c.startAt, c.endAt)}
                    </span>
                    <Button type="submit" size="sm">
                      この日時で確定
                    </Button>
                  </form>
                ))}
              </div>
            </CardBody>
          </Card>
        </section>

        <section>
          <SectionTitle>都合が合わない場合</SectionTitle>
          <p className="mb-2 px-1 text-xs text-ink-soft">
            候補に合うものがなければ、あなたから新たに
            {SCHEDULING_RULES.MIN_CANDIDATES}件以上の候補を提示できます。
          </p>
          <Card>
            <CardBody>
              <CandidateForm action={proposeCandidates} matchId={matchId} />
            </CardBody>
          </Card>
        </section>
      </div>
    );
  }

  // 自分が提示済みで相手の選択待ち（提示者側の待ち画面）
  return (
    <Card>
      <CardBody>
        <p className="text-sm font-bold text-ink">お相手の返答をお待ちください</p>
        <p className="mt-1 text-xs text-ink-soft">
          提示した日程候補から、お相手が日時を選ぶと確定します。
        </p>
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

  return (
    <div className="space-y-5">
      {/* 確定日時 */}
      <section>
        <SectionTitle>確定した日時</SectionTitle>
        <Card>
          <CardBody>
            <p className="text-lg font-bold text-primary-strong">
              {formatSlot(event.startAt, event.endAt)}
            </p>
            <p className="mt-1 text-xs text-ink-faint">
              {formatDateTime(event.startAt)} 開始
            </p>
          </CardBody>
        </Card>
      </section>

      {/* 店舗情報 */}
      <section>
        <SectionTitle>店舗情報</SectionTitle>
        <Card>
          <CardBody className="space-y-1.5">
            {event.store ? (
              <>
                <p className="text-sm font-bold text-ink">{event.store.name}</p>
                {event.store.area && (
                  <p className="text-xs text-ink-soft">{event.store.area}</p>
                )}
                <p className="text-xs text-ink-soft">{event.store.address}</p>
                {event.store.phone && (
                  <p className="text-xs text-ink-soft">TEL：{event.store.phone}</p>
                )}
                {event.reservationName && (
                  <p className="mt-1 text-xs text-ink-faint">
                    予約名：{event.reservationName}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-ink-soft">
                店舗は運営が確定後にこちらに表示されます。
              </p>
            )}
          </CardBody>
        </Card>
      </section>

      {/* 注意事項テンプレ */}
      {event.notesTemplate && (
        <section>
          <SectionTitle>当日の注意事項</SectionTitle>
          <Card>
            <CardBody>
              <p className="whitespace-pre-line text-xs leading-relaxed text-ink-soft">
                {event.notesTemplate}
              </p>
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

      {/* 日程変更希望（24時間前まで） */}
      <section>
        <SectionTitle>日程を変更したい</SectionTitle>
        <Card>
          <CardBody>
            {canReschedule ? (
              <form action={requestReschedule}>
                <input type="hidden" name="matchId" value={matchId} />
                <p className="mb-3 text-xs text-ink-soft">
                  開始{SCHEDULING_RULES.RESCHEDULE_CUTOFF_HOURS}時間前まで日程変更を希望できます。日程調整中に戻り、改めて候補を提示できます。
                </p>
                <Button type="submit" variant="outline" size="md" className="w-full">
                  日程変更を希望する
                </Button>
              </form>
            ) : (
              <p className="text-xs text-ink-soft">
                開始{SCHEDULING_RULES.RESCHEDULE_CUTOFF_HOURS}時間前を過ぎたため、日程変更はできません。やむを得ない場合はキャンセルをご検討ください。
              </p>
            )}
          </CardBody>
        </Card>
      </section>

      {/* デートキャンセル（ポリシー全文＋同意） */}
      <section>
        <SectionTitle>デートをキャンセルする</SectionTitle>
        <Card>
          <CardBody className="space-y-3">
            <div className="rounded-xl bg-warning-soft px-3 py-2 text-xs font-bold text-warning">
              {CANCELLATION_NOTICE_SHORT}
            </div>
            <CancellationPolicy />
            <form action={cancelDate} className="space-y-3 pt-1">
              <input type="hidden" name="matchId" value={matchId} />
              <Field label="キャンセル理由" hint="運営が状況を確認します。">
                <Textarea
                  name="reason"
                  placeholder="キャンセルの理由をご記入ください。"
                  required
                />
              </Field>
              <label className="flex items-start gap-2 text-xs text-ink-soft">
                <input
                  type="checkbox"
                  name="agree"
                  value="1"
                  required
                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                />
                <span>
                  上記のキャンセルポリシー（返金・違約金・警告）に同意します。
                </span>
              </label>
              <Button type="submit" variant="danger" size="lg">
                同意してキャンセルする
              </Button>
            </form>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

