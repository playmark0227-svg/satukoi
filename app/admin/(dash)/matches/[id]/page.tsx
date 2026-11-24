import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { IconChevronRight } from "@/components/member/icons";
import {
  PageHeader,
  Section,
  Panel,
  PanelHeader,
  PanelBody,
  DetailLayout,
  Callout,
} from "@/components/admin/ui/Layout";
import {
  StatusPill,
  MatchPhasePill,
  PaymentStatusPill,
} from "@/components/admin/ui/Pills";
import {
  SummaryGrid,
  MemberName,
  Timestamp,
  type KV,
} from "@/components/admin/ui/Data";
import { formatSlot, formatYen } from "@/lib/format";
import {
  MATCH_PHASE_LABELS,
  PAYMENT_PURPOSE_LABELS,
  PAYMENT_STATUS_LABELS,
  APPLICATION_STATUS_LABELS,
  CANCELLATION_CATEGORY_LABELS,
  SURVEY_Q1_LABELS,
  SURVEY_Q2_LABELS,
  SURVEY_Q4_LABELS,
  SCHEDULING_RULES,
  dateNotesTemplate,
} from "@/lib/constants";
import {
  matchAttentionReasons,
  MATCH_ATTENTION_LABELS,
  UNPAID_PENALTY_WHERE,
  type MatchAttentionReason,
} from "@/lib/admin/attention";
import { paymentStatusTone, type AdminTone } from "@/lib/admin/tones";
import { navLabel } from "@/lib/admin/nav";
import type { MatchPhase, PaymentStatus } from "@prisma/client";
import {
  setPhase,
  confirmStore,
  issueRefund,
  flagPenalty,
  addMemo,
  adminCancel,
} from "./actions";

const PHASE_ORDER: MatchPhase[] = [
  "SCHEDULING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
];

type TimelineItem = {
  at: Date;
  title: React.ReactNode;
  detail?: React.ReactNode;
  tone: AdminTone;
};

// 履歴の点の色（lib/admin/tones.ts の意味どおり。点は装飾なので neutral は薄い灰）
const DOT_CLASS: Record<AdminTone, string> = {
  warning: "bg-warning",
  danger: "bg-danger",
  success: "bg-success",
  primary: "bg-primary",
  violet: "bg-violet",
  neutral: "bg-ink-faint",
};

// 決済の種別名。違約金のラベルは金額入り（「違約金（5,500円）」）なので、
// 金額を別に表示する箇所では括弧の金額を外して二重表示を避ける
function purposeLabel(purpose: keyof typeof PAYMENT_PURPOSE_LABELS) {
  return PAYMENT_PURPOSE_LABELS[purpose].replace(/（[\d,]+円）$/, "");
}

// 静的エクスポート（デモ）用：全マッチを事前生成
export async function generateStaticParams() {
  if (process.env.DEMO_EXPORT !== "1") return [];
  const rows = await prisma.match.findMany({ select: { id: true } });
  return rows.map((r) => ({ id: r.id }));
}

export default async function AdminMatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const memberSelect = {
    id: true,
    nickname: true,
    fullName: true,
    photos: {
      orderBy: { order: "asc" as const },
      take: 1,
      select: { url: true },
    },
  };

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      applicant: { select: memberSelect },
      receiver: { select: memberSelect },
      application: true,
      dateEvent: { include: { store: true } },
      payments: {
        orderBy: { createdAt: "asc" },
        include: { member: { select: { id: true, nickname: true } } },
      },
      proposals: {
        orderBy: { round: "asc" },
        include: {
          proposedBy: { select: { nickname: true } },
          candidates: { orderBy: { startAt: "asc" } },
        },
      },
      cancellations: {
        orderBy: { createdAt: "asc" },
        include: { by: { select: { nickname: true } } },
      },
      surveyResponses: {
        include: { member: { select: { id: true, nickname: true } } },
      },
      adminMemos: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
    },
  });

  if (!match) notFound();

  const stores = await prisma.store.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  const { applicant, receiver, dateEvent } = match;
  const members = [
    { role: "申込", member: applicant },
    { role: "申受", member: receiver },
  ];
  const surveyByMember = new Map(
    match.surveyResponses.map((s) => [s.memberId, s]),
  );
  const latestProposal = match.proposals.at(-1);
  const refundable = match.payments.filter((p) => p.status === "SUCCEEDED");

  // ── 要対応の理由（一覧と同じ判定） ──
  const isUnpaidPenalty = (p: { purpose: string; status: string }) =>
    (UNPAID_PENALTY_WHERE.purpose.in as string[]).includes(p.purpose) &&
    (UNPAID_PENALTY_WHERE.status.in as string[]).includes(p.status);
  const unpaidPenalties = match.payments.filter(isUnpaidPenalty);
  const unpaidPenalty = unpaidPenalties.length > 0;
  const reasons = matchAttentionReasons({
    phase: match.phase,
    matchedAt: match.matchedAt,
    lastActionAt: match.lastActionAt,
    hasFirstProposal: match.proposals.length > 0,
    hasStore: !!dateEvent?.storeId,
    hasDateEvent: !!dateEvent,
    unpaidPenalty,
  });

  // 店舗の確定が「次の操作」か（日程確定済み・店舗未確定）
  const storeIsNext =
    match.phase === "CONFIRMED" && !!dateEvent && !dateEvent.storeId;

  // 自動解除の期限（日程調整中のみ。lib/scheduling.ts shouldAutoDissolve と同じ起算）
  const dissolveAt =
    match.phase === "SCHEDULING"
      ? match.proposals.length === 0
        ? new Date(
            match.matchedAt.getTime() +
              SCHEDULING_RULES.FIRST_PROPOSAL_DEADLINE_HOURS * 3_600_000,
          )
        : new Date(
            match.lastActionAt.getTime() +
              SCHEDULING_RULES.RESPONSE_DEADLINE_HOURS * 3_600_000,
          )
      : null;

  const reasonGuide: Record<
    MatchAttentionReason,
    { text: React.ReactNode; href: string; link: string }
  > = {
    NO_STORE: {
      text: "日程は確定していますが、店舗がまだ決まっていません。",
      href: "#store",
      link: "店舗を確定する",
    },
    AUTO_DISSOLVE: {
      text:
        match.proposals.length === 0
          ? `日程候補が提示されないまま、マッチ成立から${SCHEDULING_RULES.FIRST_PROPOSAL_DEADLINE_HOURS / 24}日が過ぎています。`
          : `最後のアクションから${SCHEDULING_RULES.RESPONSE_DEADLINE_HOURS}時間、動きがありません。`,
      href: "#phase",
      link: "フェーズを変更する",
    },
    UNPAID_PENALTY: {
      text: `${unpaidPenalties
        .map(
          (p) =>
            `${p.member.nickname}さんの${PAYMENT_PURPOSE_LABELS[p.purpose]}が「${PAYMENT_STATUS_LABELS[p.status]}」`,
        )
        .join("、")}のままです。決済が完了するまで利用停止の対象です。`,
      // このページに未収を解消する操作はないため、対応する画面へ案内する
      href: "/admin/cancellations?unpaid=1",
      link: `${navLabel("cancellations")}で対応する`,
    },
  };

  // ── 履歴タイムライン（時系列） ──
  const timeline: TimelineItem[] = [];
  if (match.application) {
    timeline.push({
      at: match.application.createdAt,
      title: "デートの申込み",
      tone: "violet",
      detail: (
        <>
          <p>
            {applicant.nickname}さんから{receiver.nickname}さんへ
          </p>
          {match.application.message && (
            <p className="mt-1.5 rounded-lg bg-canvas px-3 py-2 text-ink [overflow-wrap:anywhere]">
              「{match.application.message}」
            </p>
          )}
        </>
      ),
    });
    if (match.application.respondedAt) {
      const accepted = match.application.status === "ACCEPTED";
      timeline.push({
        at: match.application.respondedAt,
        title: accepted
          ? `${receiver.nickname}さんが申込みを承認`
          : `${receiver.nickname}さんが申込みに回答`,
        tone: accepted ? "success" : "neutral",
        detail: (
          <p>結果：{APPLICATION_STATUS_LABELS[match.application.status]}</p>
        ),
      });
    }
  }
  timeline.push({
    at: match.matchedAt,
    title: "マッチ成立",
    tone: "primary",
    detail: <p>30日／7日ルールの起算点</p>,
  });
  for (const p of match.proposals) {
    timeline.push({
      at: p.createdAt,
      title: `${p.proposedBy.nickname}さんが日程候補を提示（${p.round}回目）`,
      tone: "violet",
      detail: (
        <ul className="num-tnum space-y-0.5">
          {p.candidates.map((c) => (
            <li
              key={c.id}
              className={cn(c.isSelected && "font-semibold text-ink")}
            >
              ・{formatSlot(c.startAt, c.endAt)}
              {c.isSelected && (
                <StatusPill tone="primary" dot={false} className="ml-1.5">
                  選択
                </StatusPill>
              )}
            </li>
          ))}
        </ul>
      ),
    });
    for (const c of p.candidates) {
      if (c.isSelected && c.selectedAt) {
        timeline.push({
          at: c.selectedAt,
          title: "日程が確定（候補を選択）",
          tone: "primary",
          detail: <p className="num-tnum">{formatSlot(c.startAt, c.endAt)}</p>,
        });
      }
    }
  }
  if (dateEvent?.storeConfirmedAt) {
    timeline.push({
      at: dateEvent.storeConfirmedAt,
      title: "店舗が確定",
      tone: "primary",
      detail: <p>{dateEvent.store?.name ?? "店舗未選択"}</p>,
    });
  }
  for (const pay of match.payments) {
    timeline.push({
      at: pay.createdAt,
      title: (
        <>
          {purposeLabel(pay.purpose)}の決済
          <PaymentStatusPill status={pay.status} />
        </>
      ),
      tone: paymentStatusTone[pay.status],
      detail: (
        <p className="num-tnum">
          {pay.member.nickname}さん・{formatYen(pay.amount)}
        </p>
      ),
    });
  }
  for (const c of match.cancellations) {
    timeline.push({
      at: c.createdAt,
      title: `${c.by.nickname}さんの都合でキャンセル`,
      tone: "danger",
      detail: (
        <>
          <p className="num-tnum">
            {CANCELLATION_CATEGORY_LABELS[c.category]}・違約金{" "}
            {formatYen(c.penaltyAmount)}
            ・警告 {c.warningPoints}点
          </p>
          {c.reason && (
            <p className="mt-1.5 rounded-lg bg-canvas px-3 py-2 text-ink [overflow-wrap:anywhere]">
              {c.reason}
            </p>
          )}
        </>
      ),
    });
  }
  for (const s of match.surveyResponses) {
    if (s.submittedAt) {
      timeline.push({
        at: s.submittedAt,
        title: `${s.member.nickname}さんがアンケートに回答`,
        tone: "success",
      });
    }
  }
  if (match.closedAt) {
    timeline.push({
      at: match.closedAt,
      title: `終了（${MATCH_PHASE_LABELS[match.phase]}）`,
      tone: match.phase === "COMPLETED" ? "success" : "neutral",
    });
  }
  timeline.sort((a, b) => a.at.getTime() - b.at.getTime());

  const notesDefault = dateEvent?.notesTemplate ?? dateNotesTemplate();

  // ── 決済の状況（状態ごとの件数） ──
  const paymentCounts = new Map<PaymentStatus, number>();
  for (const p of match.payments) {
    paymentCounts.set(p.status, (paymentCounts.get(p.status) ?? 0) + 1);
  }

  // ── デートの要点 ──
  const summaryItems: KV[] = [
    {
      label: "日時",
      value: dateEvent ? (
        formatSlot(dateEvent.startAt, dateEvent.endAt)
      ) : (
        <>
          <span className="text-ink-soft">未確定</span>
          <span className="mt-0.5 block text-[13px] font-normal text-ink-soft">
            {latestProposal
              ? `候補${latestProposal.candidates.length}件を提示中（${latestProposal.round}回目）`
              : "日程候補はまだ提示されていません"}
          </span>
        </>
      ),
    },
    {
      label: "店舗",
      value: dateEvent?.store ? (
        <>
          {dateEvent.store.name}
          <span className="mt-0.5 block text-[13px] font-normal text-ink-soft">
            {dateEvent.store.area ?? dateEvent.store.address}
          </span>
        </>
      ) : storeIsNext ? (
        <>
          <span className="font-semibold text-warning-strong">未確定</span>
          <a
            href="#store"
            className="mt-0.5 block text-[13px] font-semibold text-primary-text hover:underline"
          >
            店舗を確定する
          </a>
        </>
      ) : (
        <span className="text-ink-soft">未確定</span>
      ),
    },
    {
      label: "決済状況",
      value:
        match.payments.length === 0 ? (
          <span className="text-ink-soft">決済なし</span>
        ) : (
          <span className="flex flex-wrap gap-1">
            {[...paymentCounts].map(([status, n]) => (
              <StatusPill key={status} tone={paymentStatusTone[status]}>
                {PAYMENT_STATUS_LABELS[status]} {n}件
              </StatusPill>
            ))}
          </span>
        ),
    },
  ];
  if (dateEvent?.reservationName) {
    summaryItems.push({ label: "予約名", value: dateEvent.reservationName });
  }

  // ── フェーズごとの説明 ──
  const phaseGuide: Record<MatchPhase, React.ReactNode> = {
    SCHEDULING:
      match.proposals.length === 0
        ? "会員どうしで日程を調整中です。まだ日程候補が提示されていません。"
        : "会員どうしで日程を調整中です。",
    CONFIRMED: dateEvent?.storeId
      ? "日程と店舗が確定しています。"
      : "日程が確定しています。",
    COMPLETED: "デートは実施済みです。",
    CANCELLED: "このマッチはキャンセルされました。",
  };

  // 終了済み（キャンセル・実施済み）のマッチ。修正用の操作は畳んで目立たせない
  const isClosed = match.phase === "CANCELLED" || match.phase === "COMPLETED";

  // ── 店舗確定フォーム（次の操作のときは開いた状態、それ以外は「変更」で開く） ──
  // 追従する右欄に収まるよう、初期値のある予約名・注意事項は畳んでおく
  // （閉じた details の中の入力も送信されるので、送る値は変わらない）
  const reservationDefault = dateEvent?.reservationName ?? "サツコイ！";
  const storeForm = dateEvent && stores.length > 0 && (
    <form action={confirmStore} className="space-y-3">
      <input type="hidden" name="matchId" value={match.id} />
      <Field label="店舗" required>
        <Select
          name="storeId"
          defaultValue={dateEvent.storeId ?? ""}
          required
          className="h-10"
        >
          <option value="" disabled>
            店舗を選択してください
          </option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}（{s.area ?? s.address}）
            </option>
          ))}
        </Select>
      </Field>
      <Disclosure
        summary={
          <>
            予約名
            <span className="font-normal text-ink-soft">
              （{reservationDefault}）
            </span>
            ・注意事項を編集
          </>
        }
      >
        <div className="space-y-3">
          <Field label="予約名">
            <Input
              name="reservationName"
              defaultValue={reservationDefault}
              className="h-10"
            />
          </Field>
          <Field label="注意事項（テンプレート）">
            <Textarea
              name="notesTemplate"
              defaultValue={notesDefault}
              rows={7}
              className="text-sm"
            />
          </Field>
        </div>
      </Disclosure>
      <Button
        type="submit"
        size="md"
        variant={storeIsNext ? "primary" : "secondary"}
        className="w-full"
      >
        店舗情報を確定
      </Button>
    </form>
  );

  const noStoresNote = (
    <p className="text-[13px] text-ink-soft">
      稼働中の店舗がありません。
      <Link
        href="/admin/stores"
        className="ml-1 font-semibold text-primary-text hover:underline"
      >
        店舗で登録してください
      </Link>
    </p>
  );

  const storePanel = dateEvent ? (
    storeIsNext ? (
      <Panel tone="warning" id="store">
        <PanelHeader
          title="店舗を確定"
          description={
            <>
              <span className="num-tnum font-semibold text-ink">
                {formatSlot(dateEvent.startAt, dateEvent.endAt)}
              </span>
              のデート。確定すると両会員に通知されます。
            </>
          }
        />
        <PanelBody>{storeForm || noStoresNote}</PanelBody>
      </Panel>
    ) : (
      <Panel id="store">
        <PanelHeader
          title="店舗情報"
          description={
            dateEvent.store
              ? [
                  dateEvent.store.name,
                  dateEvent.reservationName &&
                    `予約名 ${dateEvent.reservationName}`,
                ]
                  .filter(Boolean)
                  .join("・")
              : "店舗は未確定です。"
          }
        />
        <PanelBody className="py-3">
          {storeForm ? (
            <Disclosure
              tone={isClosed ? "muted" : "link"}
              summary={
                isClosed
                  ? "終了済みのマッチの店舗情報を修正する"
                  : dateEvent.storeId
                    ? "店舗情報を変更する"
                    : "店舗を確定する"
              }
            >
              {storeForm}
            </Disclosure>
          ) : (
            noStoresNote
          )}
        </PanelBody>
      </Panel>
    )
  ) : null;

  // ステータス欄の補足行（自動解除の期限・店舗確定の条件・終了日時）があるか
  const statusHasBody = !!dissolveAt || !dateEvent || !!match.closedAt;

  // ── 右欄：ステータスと操作 ──
  // xl 以上では右欄が画面に追従する。開いたフォームで画面より高くなっても
  // ボタンが画面外に取り残されないよう、右欄の中だけをスクロールさせる。
  const aside = (
    <div
      className={cn(
        "grid items-start gap-4 xl:max-h-[calc(100dvh-3rem)] xl:grid-cols-1 xl:overflow-y-auto",
        storePanel && "md:grid-cols-2",
      )}
    >
      <Panel>
        <PanelHeader title="ステータス" description={phaseGuide[match.phase]} />
        {statusHasBody && (
          <PanelBody className="space-y-2 py-3">
            {dissolveAt && (
              <p
                className={cn(
                  "text-[13px]",
                  reasons.includes("AUTO_DISSOLVE")
                    ? "font-semibold text-warning-strong"
                    : "text-ink-soft",
                )}
              >
                自動解除の期限：
                <Timestamp date={dissolveAt} />
                {reasons.includes("AUTO_DISSOLVE") && "（期限切れ）"}
              </p>
            )}
            {!dateEvent && (
              <p className="text-[13px] text-ink-soft">
                店舗の確定は、日程が確定すると操作できます。
              </p>
            )}
            {match.closedAt && (
              <p className="text-[13px] text-ink-soft">
                終了日時：
                <Timestamp date={match.closedAt} />
              </p>
            )}
          </PanelBody>
        )}
        <form
          id="phase"
          action={setPhase}
          className={cn(
            "flex scroll-mt-24 items-end gap-2 px-4 py-3",
            statusHasBody && "border-t border-line",
          )}
        >
          <input type="hidden" name="matchId" value={match.id} />
          <Field label="フェーズを変更" className="min-w-0 flex-1">
            <Select name="phase" defaultValue={match.phase} className="h-10">
              {PHASE_ORDER.map((p) => (
                <option key={p} value={p}>
                  {MATCH_PHASE_LABELS[p]}
                </option>
              ))}
            </Select>
          </Field>
          <Button
            type="submit"
            size="md"
            variant="secondary"
            className="shrink-0"
          >
            変更
          </Button>
        </form>
      </Panel>
      {storePanel}
    </div>
  );

  // ── デートの概要（要点＋両会員） ──
  const overviewSection = (
    <Section title="デートの概要">
      <Panel>
        <PanelBody>
          <SummaryGrid
            items={summaryItems}
            className={cn(summaryItems.length === 3 && "md:grid-cols-3")}
          />
        </PanelBody>
        <ul className="grid divide-y divide-line border-t border-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          {members.map(({ role, member }) => (
            <li
              key={member.id}
              className="flex min-w-0 items-center gap-3 px-4 py-3"
            >
              <Avatar
                url={member.photos[0]?.url}
                name={member.nickname}
                className="h-10 w-10"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink-soft">
                  {role}会員
                </p>
                <MemberName member={member} className="text-sm" />
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </Section>
  );

  // ── 決済（0件なら出さない。要点の「決済状況」に「決済なし」と出ている） ──
  const paymentsSection = match.payments.length > 0 && (
    <Section title="決済" count={match.payments.length} id="payments">
      <Panel>
        <ul className="divide-y divide-line">
          {match.payments.map((p) => (
            <li
              key={p.id}
              className={cn(
                "flex items-center justify-between gap-3 px-4 py-3",
                isUnpaidPenalty(p) &&
                  "shadow-[inset_3px_0_0_var(--color-warning)]",
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">
                  {purposeLabel(p.purpose)}
                </p>
                <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-[13px] text-ink-soft">
                  <MemberName
                    member={p.member}
                    full={false}
                    className="text-[13px]"
                  />
                  <Timestamp date={p.createdAt} />
                  {p.waivedReason && <span>無料：{p.waivedReason}</span>}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
                <span className="num-tnum text-sm font-semibold text-ink">
                  {formatYen(p.amount)}
                </span>
                <PaymentStatusPill status={p.status} />
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </Section>
  );

  // ── アンケート ──
  const anySurvey = match.surveyResponses.some(
    (s) => s.submittedAt || s.sentAt,
  );
  const surveySection = (
    <Section title="アンケート">
      <Panel>
        {!anySurvey ? (
          <p className="px-4 py-3 text-sm text-ink-soft">
            回答はまだありません。
            {(match.phase === "SCHEDULING" || match.phase === "CONFIRMED") &&
              `デート開始の${SCHEDULING_RULES.SURVEY_SEND_AFTER_HOURS}時間後に両会員へ送信されます。`}
          </p>
        ) : (
          <div className="grid divide-y divide-line md:grid-cols-2 md:divide-x md:divide-y-0">
            {members.map(({ member }) => {
              const s = surveyByMember.get(member.id);
              const answered = !!s?.submittedAt;
              return (
                <div key={member.id} className="min-w-0 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <MemberName
                      member={member}
                      full={false}
                      className="text-sm"
                    />
                    <StatusPill tone={answered ? "success" : "neutral"}>
                      {answered ? "回答済" : "未回答"}
                    </StatusPill>
                  </div>
                  {s && s.submittedAt ? (
                    <>
                      <dl className="mt-2.5 grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-[13px]">
                        <SurveyRow
                          q="実施状況"
                          a={SURVEY_Q1_LABELS[s.q1Implementation]}
                        />
                        <SurveyRow
                          q="満足度"
                          a={SURVEY_Q2_LABELS[s.q2Satisfaction]}
                        />
                        <SurveyRow
                          q="次のご希望"
                          a={
                            <span
                              className={cn(
                                "font-semibold",
                                s.q4Intent === "WANT_AGAIN"
                                  ? "text-success-strong"
                                  : "text-ink",
                              )}
                            >
                              {SURVEY_Q4_LABELS[s.q4Intent]}
                            </span>
                          }
                        />
                        <SurveyRow q="お相手への感想" a={s.q3Impression} />
                        {s.q5Other && (
                          <SurveyRow q="その他ご意見" a={s.q5Other} />
                        )}
                      </dl>
                      <p className="mt-2.5 text-xs text-ink-soft">
                        回答 <Timestamp date={s.submittedAt} />
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-[13px] text-ink-soft">
                      {s?.dueAt ? (
                        <>
                          回答期限 <Timestamp date={s.dueAt} />
                        </>
                      ) : s?.sentAt ? (
                        <>
                          送信 <Timestamp date={s.sentAt} />
                        </>
                      ) : (
                        "まだ回答していません。"
                      )}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </Section>
  );

  // ── 履歴 ──
  const timelineSection = (
    <Section title="履歴" count={timeline.length}>
      <Panel>
        <PanelBody>
          {timeline.length === 0 ? (
            <p className="text-sm text-ink-soft">履歴はまだありません。</p>
          ) : (
            <ol>
              {timeline.map((t, i) => {
                const first = i === 0;
                const last = i === timeline.length - 1;
                return (
                  <li key={i} className="flex gap-3">
                    {/* PC：日時を左の列にそろえる */}
                    <Timestamp
                      date={t.at}
                      className="hidden w-32 shrink-0 pt-px text-right text-[13px] text-ink-soft md:block"
                    />
                    {/* 縦線と点 */}
                    <div
                      className="relative flex w-3 shrink-0 justify-center"
                      aria-hidden
                    >
                      <span
                        className={cn(
                          "absolute w-px bg-line",
                          first ? "top-2" : "top-0",
                          last ? "h-2" : "bottom-0",
                        )}
                      />
                      <span
                        className={cn(
                          "relative mt-[5px] h-2.5 w-2.5 rounded-full ring-4 ring-surface",
                          DOT_CLASS[t.tone],
                        )}
                      />
                    </div>
                    <div className={cn("min-w-0 flex-1", !last && "pb-5")}>
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold text-ink">
                        {t.title}
                      </p>
                      <Timestamp
                        date={t.at}
                        className="block text-[13px] text-ink-soft md:hidden"
                      />
                      {t.detail && (
                        <div className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                          {t.detail}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </PanelBody>
      </Panel>
    </Section>
  );

  // ── 運営メモ ──
  const memoSection = (
    <Section title="運営メモ" count={match.adminMemos.length}>
      <Panel>
        <PanelBody>
          <form action={addMemo} className="max-w-3xl space-y-2">
            <input type="hidden" name="matchId" value={match.id} />
            <Field label="メモを追加">
              <Textarea
                name="body"
                placeholder="このマッチに関する運営メモを記録"
                rows={2}
                required
                className="min-h-20"
              />
            </Field>
            <Button type="submit" variant="secondary" size="md">
              メモを追加
            </Button>
          </form>
        </PanelBody>
        {/* メモ0件のときは何も出さない（件数は見出しの横に出ている） */}
        {match.adminMemos.length > 0 && (
          <ul className="divide-y divide-line border-t border-line">
            {match.adminMemos.map((memo) => (
              <li key={memo.id} className="px-4 py-3">
                <p className="text-[13px] text-ink-soft">
                  <span className="font-semibold text-ink">
                    {memo.author?.name ?? "運営"}
                  </span>
                  <span className="mx-1.5" aria-hidden>
                    ・
                  </span>
                  <Timestamp date={memo.createdAt} />
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink [overflow-wrap:anywhere]">
                  {memo.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </Section>
  );

  // ── キャンセル確定フォーム ──
  const cancelIntro = (
    <p className="mt-0.5 text-[13px] text-ink-soft">
      キャンセル区分はデート開始時刻から自動判定し、返金・違約金・警告を確定します。
    </p>
  );
  const cancelForm = (
    <form action={adminCancel} className="mt-3 max-w-xl space-y-3">
      <input type="hidden" name="matchId" value={match.id} />
      <Field label="キャンセル者" className="sm:w-60">
        <Select
          name="byMemberId"
          defaultValue={match.applicantId}
          className="h-10"
        >
          {members.map(({ member }) => (
            <option key={member.id} value={member.id}>
              {member.nickname}さん
            </option>
          ))}
        </Select>
      </Field>
      <Field label="理由・メモ">
        <Textarea
          name="reason"
          placeholder="キャンセルの経緯や運営判断を記録"
          rows={3}
          className="min-h-20"
        />
      </Field>
      <Button type="submit" variant="danger-outline" size="md">
        キャンセルを確定
      </Button>
    </form>
  );

  // ── 取り消せない操作（返金・違約金・キャンセル） ──
  const dangerSection = (
    <Panel tone="danger" id="danger">
      <PanelHeader
        tone="danger"
        title="取り消せない操作"
        description="返金・違約金・キャンセルは元に戻せません。実行前に内容をよく確認してください。"
      />
      <div className="divide-y divide-line">
        {/* 返金 */}
        {refundable.length === 0 ? (
          <p className="px-4 py-3 text-[13px] text-ink-soft">
            <span className="font-bold text-ink">返金</span>
            <span className="mx-1.5" aria-hidden>
              ・
            </span>
            返金できる決済（完了済み）はありません。
          </p>
        ) : (
          <div className="px-4 py-4">
            <p className="text-sm font-bold text-ink">返金</p>
            <p className="mt-0.5 text-[13px] text-ink-soft">
              完了済みの決済を全額返金します。
            </p>
            <ul className="mt-3 divide-y divide-line rounded-lg bg-canvas">
              {refundable.map((p) => (
                <li key={p.id}>
                  <form
                    action={issueRefund}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <input type="hidden" name="matchId" value={match.id} />
                    <input type="hidden" name="paymentId" value={p.id} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink">
                        {purposeLabel(p.purpose)}
                        <span className="num-tnum ml-1.5">
                          {formatYen(p.amount)}
                        </span>
                      </span>
                      <MemberName
                        member={p.member}
                        full={false}
                        className="text-[13px]"
                      />
                    </span>
                    <Button
                      type="submit"
                      variant="danger-outline"
                      size="sm"
                      className="shrink-0"
                    >
                      全額返金
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 違約金の計上 */}
        <div className="px-4 py-4" id="penalty">
          <p className="text-sm font-bold text-ink">違約金を計上</p>
          <p className="mt-0.5 text-[13px] text-ink-soft">
            対象会員に違約金の決済予定を追加します。
          </p>
          <form action={flagPenalty} className="mt-3 space-y-3">
            <input type="hidden" name="matchId" value={match.id} />
            <div className="grid max-w-xl gap-3 sm:grid-cols-2">
              <Field label="対象会員">
                <Select
                  name="memberId"
                  defaultValue={match.applicantId}
                  className="h-10"
                >
                  {members.map(({ member }) => (
                    <option key={member.id} value={member.id}>
                      {member.nickname}さん
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="違約金区分">
                <Select
                  name="purpose"
                  defaultValue="PENALTY_5500"
                  className="h-10"
                >
                  <option value="PENALTY_5500">
                    {PAYMENT_PURPOSE_LABELS.PENALTY_5500}
                  </option>
                  <option value="PENALTY_11000">
                    {PAYMENT_PURPOSE_LABELS.PENALTY_11000}
                  </option>
                </Select>
              </Field>
            </div>
            <Button type="submit" variant="danger-outline" size="md">
              違約金を計上
            </Button>
          </form>
        </div>

        {/* キャンセル確定（終了済みのマッチでは畳んでおく。フォームはそのまま） */}
        <div className="px-4 py-4" id="cancel">
          <p className="text-sm font-bold text-ink">キャンセルを確定</p>
          {isClosed ? (
            <>
              <p className="mt-0.5 text-[13px] text-ink-soft">
                このマッチは
                {match.phase === "CANCELLED"
                  ? "すでにキャンセル済み"
                  : "デート実施済み"}
                です。通常、この操作は必要ありません。
              </p>
              <Disclosure
                tone="muted"
                summary="終了済みのマッチを修正する"
                className="mt-2"
              >
                {cancelIntro}
                {cancelForm}
              </Disclosure>
            </>
          ) : (
            <>
              {cancelIntro}
              {cancelForm}
            </>
          )}
        </div>
      </div>
    </Panel>
  );

  const main = (
    <>
      {overviewSection}
      {paymentsSection}
      {surveySection}
      {timelineSection}
      {memoSection}
      {dangerSection}
    </>
  );

  return (
    <div>
      <PageHeader
        back={{ href: "/admin/matches", label: navLabel("matches") }}
        title={
          <span className="[overflow-wrap:anywhere]">
            {applicant.nickname}
            <span className="font-normal">さん</span>
            <span className="mx-1.5 font-normal text-ink-soft">×</span>
            {receiver.nickname}
            <span className="font-normal">さん</span>
          </span>
        }
        status={<MatchPhasePill phase={match.phase} size="md" />}
        meta={
          <>
            <span>
              マッチ成立 <Timestamp date={match.matchedAt} dateOnly />
            </span>
            <span>
              最終更新 <Timestamp date={match.lastActionAt} />
            </span>
            <span title={`マッチID：${match.id}`}>
              ID <span className="font-mono">…{match.id.slice(-8)}</span>
            </span>
          </>
        }
      />

      {reasons.length > 0 && (
        <Callout tone="warning" title={`対応が必要です（${reasons.length}件）`}>
          <ul className="mt-1 space-y-1">
            {reasons.map((r) => {
              const g = reasonGuide[r];
              const linkClass =
                "ml-1.5 font-semibold whitespace-nowrap text-primary-text underline-offset-2 hover:underline";
              return (
                <li key={r}>
                  <span className="font-bold">{MATCH_ATTENTION_LABELS[r]}</span>
                  <span aria-hidden>：</span>
                  {g.text}
                  {g.href.startsWith("#") ? (
                    <a href={g.href} className={linkClass}>
                      {g.link}
                    </a>
                  ) : (
                    <Link href={g.href} className={linkClass}>
                      {g.link}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </Callout>
      )}

      <DetailLayout main={main} aside={aside} />
    </div>
  );
}

/**
 * 開閉式の欄（details/summary。JS なしで開閉できる）。
 * tone="link" は次に使う可能性のある操作（青）、"muted" は通常は不要な修正用（灰）。
 * 閉じていても中の入力はフォームと一緒に送信される。
 */
function Disclosure({
  summary,
  tone = "link",
  className,
  children,
}: {
  summary: React.ReactNode;
  tone?: "link" | "muted";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <details className={cn("group", className)}>
      <summary className="flex cursor-pointer list-none items-start gap-1 select-none [&::-webkit-details-marker]:hidden">
        <IconChevronRight
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0 transition-transform group-open:rotate-90",
            tone === "link" ? "text-primary-text" : "text-ink-soft",
          )}
        />
        <span
          className={cn(
            "min-w-0 text-[13px] font-semibold [overflow-wrap:anywhere] hover:underline",
            tone === "link"
              ? "text-primary-text"
              : "text-ink-soft hover:text-ink",
          )}
        >
          {summary}
        </span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function SurveyRow({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <>
      <dt className="text-ink-soft">{q}</dt>
      <dd className="min-w-0 text-ink [overflow-wrap:anywhere]">{a}</dd>
    </>
  );
}
