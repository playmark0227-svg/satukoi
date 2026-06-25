import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardBody, SectionTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import {
  MatchPhaseBadge,
  PaymentStatusBadge,
} from "@/components/ui/StatusBadge";
import {
  formatDate,
  formatDateTime,
  formatSlot,
  formatYen,
} from "@/lib/format";
import {
  MATCH_PHASE_LABELS,
  PAYMENT_PURPOSE_LABELS,
  APPLICATION_STATUS_LABELS,
  SURVEY_Q1_LABELS,
  SURVEY_Q2_LABELS,
  SURVEY_Q4_LABELS,
  dateNotesTemplate,
} from "@/lib/constants";
import type { MatchPhase } from "@prisma/client";
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
  title: string;
  detail?: React.ReactNode;
  tone: "neutral" | "primary" | "success" | "info" | "warning" | "danger";
};

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

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      applicant: { select: { id: true, nickname: true, fullName: true } },
      receiver: { select: { id: true, nickname: true, fullName: true } },
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

  const members = [match.applicant, match.receiver];
  const surveyByMember = new Map(
    match.surveyResponses.map((s) => [s.memberId, s])
  );

  // ── 履歴タイムライン（時系列） ──
  const timeline: TimelineItem[] = [];
  if (match.application) {
    timeline.push({
      at: match.application.createdAt,
      title: "デート申込み",
      tone: "info",
      detail: (
        <span>
          {match.applicant.nickname}さん →{" "}
          {match.receiver.nickname}さん
          {match.application.message && (
            <span className="mt-1 block text-ink-soft">
              「{match.application.message}」
            </span>
          )}
        </span>
      ),
    });
    if (match.application.respondedAt) {
      timeline.push({
        at: match.application.respondedAt,
        title: "申受（承認）",
        tone: "success",
        detail: (
          <span>
            状態：{APPLICATION_STATUS_LABELS[match.application.status]}
          </span>
        ),
      });
    }
  }
  timeline.push({
    at: match.matchedAt,
    title: "マッチ成立",
    tone: "primary",
    detail: <span>30日／7日ルールの起算点</span>,
  });
  for (const p of match.proposals) {
    const selected = p.candidates.filter((c) => c.isSelected);
    timeline.push({
      at: p.createdAt,
      title: `日程候補の提示（${p.round}回目）`,
      tone: "info",
      detail: (
        <div>
          <p>
            {p.proposedBy.nickname}さんが {p.candidates.length} 件提示
          </p>
          <ul className="mt-1 space-y-0.5 text-ink-soft">
            {p.candidates.map((c) => (
              <li key={c.id}>
                ・{formatSlot(c.startAt, c.endAt)}
                {c.isSelected && (
                  <span className="ml-1 font-bold text-primary">［選択］</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ),
    });
    for (const c of selected) {
      if (c.selectedAt) {
        timeline.push({
          at: c.selectedAt,
          title: "候補の選択（日程確定）",
          tone: "primary",
          detail: <span>{formatSlot(c.startAt, c.endAt)}</span>,
        });
      }
    }
  }
  if (match.dateEvent?.storeConfirmedAt) {
    timeline.push({
      at: match.dateEvent.storeConfirmedAt,
      title: "店舗情報の確定",
      tone: "primary",
      detail: (
        <span>{match.dateEvent.store?.name ?? "店舗未選択"}</span>
      ),
    });
  }
  for (const pay of match.payments) {
    timeline.push({
      at: pay.createdAt,
      title: `決済：${PAYMENT_PURPOSE_LABELS[pay.purpose]}`,
      tone: pay.status === "SUCCEEDED" ? "success" : "warning",
      detail: (
        <span>
          {pay.member.nickname}さん／{formatYen(pay.amount)}
        </span>
      ),
    });
  }
  for (const c of match.cancellations) {
    timeline.push({
      at: c.createdAt,
      title: "キャンセル処理",
      tone: "danger",
      detail: (
        <span>
          {c.by.nickname}さん都合／違約金 {formatYen(c.penaltyAmount)}／警告{" "}
          {c.warningPoints}点
        </span>
      ),
    });
  }
  for (const s of match.surveyResponses) {
    if (s.submittedAt) {
      timeline.push({
        at: s.submittedAt,
        title: "アンケート回答",
        tone: "success",
        detail: <span>{s.member.nickname}さんが回答</span>,
      });
    }
  }
  if (match.closedAt) {
    timeline.push({
      at: match.closedAt,
      title: `クローズ（${MATCH_PHASE_LABELS[match.phase]}）`,
      tone: match.phase === "COMPLETED" ? "success" : "neutral",
    });
  }
  timeline.sort((a, b) => a.at.getTime() - b.at.getTime());

  const notesDefault = match.dateEvent?.notesTemplate ?? dateNotesTemplate();

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-sm">
        <Link href="/admin/matches" className="text-primary hover:underline">
          ← マッチ一覧
        </Link>
        <span className="text-ink-faint">/</span>
        <span className="text-ink-soft">マッチ {match.id.slice(-8)}</span>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-xl font-bold text-ink">デート詳細</h1>
        <MatchPhaseBadge phase={match.phase} />
      </div>

      {/* ════ 上部：ステータス概要 ════ */}
      <section className="mb-6">
        <SectionTitle>ステータス概要</SectionTitle>
        <Card>
          <CardBody className="space-y-4">
            {/* 両会員 */}
            <div className="grid grid-cols-2 gap-3">
              {members.map((m, idx) => (
                <Link
                  key={m.id}
                  href={`/admin/members/${m.id}`}
                  className="flex items-center gap-3 rounded-xl border border-line p-3 hover:bg-canvas"
                >
                  <Avatar name={m.nickname} className="h-11 w-11 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-ink-faint">
                      {idx === 0 ? "申込会員" : "申受会員"}
                    </p>
                    <p className="truncate text-sm font-bold text-ink">
                      {m.nickname}さん
                    </p>
                    <p className="truncate text-xs text-ink-faint">
                      {m.fullName}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* 実施日時 */}
            <div className="rounded-xl bg-canvas px-3 py-2.5">
              <p className="text-[11px] font-bold text-ink-faint">実施日時</p>
              <p className="text-sm font-medium text-ink">
                {match.dateEvent
                  ? formatSlot(match.dateEvent.startAt, match.dateEvent.endAt)
                  : "未確定"}
              </p>
              {match.dateEvent?.store && (
                <p className="mt-0.5 text-xs text-ink-soft">
                  {match.dateEvent.store.name}（{match.dateEvent.store.address}）
                </p>
              )}
            </div>

            {/* 決済状況 */}
            <div>
              <p className="mb-1.5 text-[11px] font-bold text-ink-faint">
                決済状況
              </p>
              {match.payments.length === 0 ? (
                <p className="text-sm text-ink-soft">決済はまだありません。</p>
              ) : (
                <ul className="space-y-1.5">
                  {match.payments.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-sm"
                    >
                      <span className="min-w-0">
                        <span className="font-medium text-ink">
                          {PAYMENT_PURPOSE_LABELS[p.purpose]}
                        </span>
                        <span className="ml-2 text-ink-soft">
                          {p.member.nickname}さん
                        </span>
                        <span className="ml-2 text-ink-faint">
                          {formatYen(p.amount)}
                        </span>
                        {p.waivedReason && (
                          <span className="ml-2 text-xs text-ink-faint">
                            （無料：{p.waivedReason}）
                          </span>
                        )}
                      </span>
                      <PaymentStatusBadge status={p.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* アンケート結果照会 */}
            <div>
              <p className="mb-1.5 text-[11px] font-bold text-ink-faint">
                アンケート結果照会
              </p>
              <div className="grid grid-cols-1 gap-2">
                {members.map((m) => {
                  const s = surveyByMember.get(m.id);
                  return (
                    <div
                      key={m.id}
                      className="rounded-lg border border-line px-3 py-2.5 text-sm"
                    >
                      <p className="font-bold text-ink">
                        {m.nickname}さんの回答
                      </p>
                      {s && s.submittedAt ? (
                        <dl className="mt-1.5 space-y-1 text-xs text-ink-soft">
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
                            a={SURVEY_Q4_LABELS[s.q4Intent]}
                          />
                          <SurveyRow q="お相手への感想" a={s.q3Impression} />
                          {s.q5Other && (
                            <SurveyRow q="その他ご意見" a={s.q5Other} />
                          )}
                        </dl>
                      ) : (
                        <p className="mt-1 text-xs text-ink-faint">
                          未回答です。
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardBody>
        </Card>
      </section>

      {/* ════ 中央：履歴タイムライン ════ */}
      <section className="mb-6">
        <SectionTitle>履歴タイムライン</SectionTitle>
        <Card>
          <CardBody>
            {timeline.length === 0 ? (
              <p className="text-sm text-ink-soft">履歴はまだありません。</p>
            ) : (
              <ol className="relative space-y-4 border-l border-line pl-5">
                {timeline.map((t, i) => (
                  <li key={i} className="relative">
                    <span
                      className={`absolute -left-[1.4rem] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-surface ${dotColor(
                        t.tone
                      )}`}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={t.tone}>{t.title}</Badge>
                      <span className="text-xs text-ink-faint">
                        {formatDateTime(t.at)}
                      </span>
                    </div>
                    {t.detail && (
                      <div className="mt-1 text-sm text-ink">{t.detail}</div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </CardBody>
        </Card>
      </section>

      {/* ════ 下部：運営操作 ════ */}
      <section>
        <SectionTitle>運営操作</SectionTitle>
        <div className="space-y-3">
          {/* フェーズ手動変更 */}
          <Card>
            <CardBody>
              <h3 className="mb-2 text-sm font-bold text-ink">
                フェーズ手動変更
              </h3>
              <form action={setPhase} className="flex items-end gap-2">
                <input type="hidden" name="matchId" value={match.id} />
                <Field label="フェーズ" className="flex-1">
                  <Select name="phase" defaultValue={match.phase}>
                    {PHASE_ORDER.map((p) => (
                      <option key={p} value={p}>
                        {MATCH_PHASE_LABELS[p]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Button type="submit" size="md" className="shrink-0">
                  変更
                </Button>
              </form>
            </CardBody>
          </Card>

          {/* 店舗情報確定 */}
          <Card>
            <CardBody>
              <h3 className="mb-2 text-sm font-bold text-ink">店舗情報確定</h3>
              {stores.length === 0 ? (
                <p className="text-sm text-ink-soft">
                  稼働中の店舗がありません。
                  <Link href="/admin/stores" className="ml-1 text-primary">
                    店舗管理で登録してください。
                  </Link>
                </p>
              ) : !match.dateEvent ? (
                <p className="text-sm text-ink-soft">
                  日程が未確定のため、店舗確定はできません。
                </p>
              ) : (
                <form action={confirmStore} className="space-y-3">
                  <input type="hidden" name="matchId" value={match.id} />
                  <Field label="店舗を選択" required>
                    <Select
                      name="storeId"
                      defaultValue={match.dateEvent.storeId ?? ""}
                      required
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
                  <Field label="予約名">
                    <Input
                      name="reservationName"
                      defaultValue={
                        match.dateEvent.reservationName ?? "サツコイ！"
                      }
                    />
                  </Field>
                  <Field label="注意事項（テンプレート）">
                    <Textarea
                      name="notesTemplate"
                      defaultValue={notesDefault}
                      rows={5}
                    />
                  </Field>
                  <Button type="submit" size="md">
                    店舗情報を確定
                  </Button>
                </form>
              )}
            </CardBody>
          </Card>

          {/* 返金 / 違約金フラグ */}
          <Card>
            <CardBody>
              <h3 className="mb-2 text-sm font-bold text-ink">
                返金 / 違約金フラグ
              </h3>

              {/* 返金（成功済の決済から選択） */}
              <p className="mb-1 text-xs font-bold text-ink-faint">返金処理</p>
              {match.payments.filter((p) => p.status === "SUCCEEDED").length ===
              0 ? (
                <p className="mb-3 text-sm text-ink-soft">
                  返金可能な決済（完了済）がありません。
                </p>
              ) : (
                <div className="mb-3 space-y-2">
                  {match.payments
                    .filter((p) => p.status === "SUCCEEDED")
                    .map((p) => (
                      <form
                        key={p.id}
                        action={issueRefund}
                        className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2"
                      >
                        <input type="hidden" name="matchId" value={match.id} />
                        <input type="hidden" name="paymentId" value={p.id} />
                        <span className="text-sm text-ink">
                          {p.member.nickname}さん／
                          {PAYMENT_PURPOSE_LABELS[p.purpose]}／
                          {formatYen(p.amount)}
                        </span>
                        <Button
                          type="submit"
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                        >
                          全額返金
                        </Button>
                      </form>
                    ))}
                </div>
              )}

              {/* 違約金フラグ */}
              <p className="mb-1 text-xs font-bold text-ink-faint">
                違約金フラグ（決済予定を計上）
              </p>
              <form action={flagPenalty} className="space-y-2">
                <input type="hidden" name="matchId" value={match.id} />
                <div className="flex items-end gap-2">
                  <Field label="対象会員" className="flex-1">
                    <Select name="memberId" defaultValue={match.applicantId}>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nickname}さん
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="違約金区分" className="flex-1">
                    <Select name="purpose" defaultValue="PENALTY_5500">
                      <option value="PENALTY_5500">
                        {PAYMENT_PURPOSE_LABELS.PENALTY_5500}
                      </option>
                      <option value="PENALTY_11000">
                        {PAYMENT_PURPOSE_LABELS.PENALTY_11000}
                      </option>
                    </Select>
                  </Field>
                </div>
                <Button type="submit" variant="danger" size="sm">
                  違約金を計上
                </Button>
              </form>
            </CardBody>
          </Card>

          {/* キャンセル処理 */}
          <Card>
            <CardBody>
              <h3 className="mb-2 text-sm font-bold text-ink">キャンセル処理</h3>
              <p className="mb-3 text-xs text-ink-soft">
                キャンセル区分はデート開始時刻から自動判定し、返金・違約金・警告を確定します。
              </p>
              <form action={adminCancel} className="space-y-3">
                <input type="hidden" name="matchId" value={match.id} />
                <Field label="キャンセル者">
                  <Select name="byMemberId" defaultValue={match.applicantId}>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nickname}さん
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="理由・メモ">
                  <Textarea
                    name="reason"
                    placeholder="キャンセルの経緯や運営判断を記録"
                    rows={3}
                  />
                </Field>
                <Button type="submit" variant="danger" size="md">
                  キャンセルを確定
                </Button>
              </form>
            </CardBody>
          </Card>

          {/* 運営メモ */}
          <Card>
            <CardBody>
              <h3 className="mb-2 text-sm font-bold text-ink">運営メモ</h3>
              <form action={addMemo} className="space-y-2">
                <input type="hidden" name="matchId" value={match.id} />
                <Textarea
                  name="body"
                  placeholder="このマッチに関する運営メモを記録"
                  rows={3}
                  required
                />
                <Button type="submit" variant="secondary" size="sm">
                  メモを追加
                </Button>
              </form>

              {match.adminMemos.length > 0 && (
                <ul className="mt-3 space-y-2 border-t border-line pt-3">
                  {match.adminMemos.map((memo) => (
                    <li key={memo.id} className="text-sm">
                      <p className="whitespace-pre-wrap text-ink">{memo.body}</p>
                      <p className="mt-0.5 text-xs text-ink-faint">
                        {memo.author?.name ?? "運営"}・
                        {formatDate(memo.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </section>
    </div>
  );
}

function SurveyRow({ q, a }: { q: string; a: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 font-medium text-ink-faint">{q}</dt>
      <dd className="text-ink-soft">{a}</dd>
    </div>
  );
}

function dotColor(tone: TimelineItem["tone"]): string {
  switch (tone) {
    case "primary":
      return "bg-primary";
    case "success":
      return "bg-success";
    case "warning":
      return "bg-warning";
    case "danger":
      return "bg-danger";
    case "info":
      return "bg-info";
    default:
      return "bg-line";
  }
}
