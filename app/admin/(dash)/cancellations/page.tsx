import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { MemberStatusBadge } from "@/components/ui/StatusBadge";
import {
  CANCELLATION_CATEGORY_LABELS,
  PAYMENT_STATUS_LABELS,
  WARNING_RULES,
} from "@/lib/constants";
import { formatYen, formatDateTime, formatDate } from "@/lib/format";
import { addWarning, suspend, forceWithdraw } from "./actions";


const CATEGORY_TONE = {
  BEFORE_24H: "neutral",
  H24_TO_2H: "warning",
  WITHIN_2H_OR_NOSHOW: "danger",
} as const;

export default async function AdminCancellationsPage() {
  const cancellations = await prisma.cancellation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      by: { select: { id: true, nickname: true, fullName: true, status: true } },
      match: {
        select: {
          id: true,
          applicantId: true,
          receiverId: true,
          dateEvent: { select: { startAt: true, endAt: true } },
        },
      },
      warnings: { select: { id: true } },
    },
  });

  // 各キャンセルの違約金決済の有無を取得（対応状況の判定用）
  const matchIds = [...new Set(cancellations.map((c) => c.matchId))];
  const penaltyPayments = matchIds.length
    ? await prisma.payment.findMany({
        where: {
          matchId: { in: matchIds },
          purpose: { in: ["PENALTY_5500", "PENALTY_11000"] },
        },
        select: { matchId: true, memberId: true, status: true, amount: true },
      })
    : [];

  // 1年以内の有効な警告点を会員ごとに集計
  const now = new Date();
  const byMemberIds = [...new Set(cancellations.map((c) => c.byMemberId))];
  const activeWarnings = byMemberIds.length
    ? await prisma.warning.findMany({
        where: { memberId: { in: byMemberIds }, expiresAt: { gt: now } },
        select: { memberId: true, points: true },
      })
    : [];
  const warningPointsByMember = new Map<string, number>();
  for (const w of activeWarnings) {
    warningPointsByMember.set(
      w.memberId,
      (warningPointsByMember.get(w.memberId) ?? 0) + w.points
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-ink">
        キャンセル・ペナルティ
      </h1>
      <p className="mb-4 text-sm text-ink-soft">
        デートのキャンセル履歴を確認し、警告点の付与・利用停止・強制退会を行います（全 {cancellations.length} 件）。
        1年以内に警告 {WARNING_RULES.FORCED_WITHDRAWAL_POINTS} 点以上で強制退会の対象です。
      </p>

      {cancellations.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon="🗒"
              title="キャンセル履歴はありません"
              description="デートのキャンセルが発生するとここに表示されます。"
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {cancellations.map((c) => {
            const penalty = penaltyPayments.find(
              (p) => p.matchId === c.matchId && p.memberId === c.byMemberId
            );
            const activePoints = warningPointsByMember.get(c.byMemberId) ?? 0;
            const willForceWithdraw =
              activePoints >= WARNING_RULES.FORCED_WITHDRAWAL_POINTS;
            const start = c.match?.dateEvent?.startAt;

            return (
              <Card key={c.id}>
                <CardBody>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge tone={CATEGORY_TONE[c.category]}>
                      {CANCELLATION_CATEGORY_LABELS[c.category]}
                    </Badge>
                    <MemberStatusBadge status={c.by.status} />
                    {willForceWithdraw && (
                      <Badge tone="danger">強制退会対象（{activePoints}点）</Badge>
                    )}
                  </div>

                  <p className="text-sm font-bold text-ink">
                    <Link
                      href={`/admin/members/${c.by.id}`}
                      className="text-primary hover:underline"
                    >
                      {c.by.nickname}さん
                    </Link>
                    <span className="ml-1 text-xs font-normal text-ink-faint">
                      （{c.by.fullName}）がキャンセル
                    </span>
                  </p>

                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-ink-soft">
                    <div>
                      <dt className="text-ink-faint">キャンセル日時</dt>
                      <dd>{formatDateTime(c.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-faint">デート開始予定</dt>
                      <dd>{start ? formatDateTime(start) : "未確定"}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-faint">違約金</dt>
                      <dd>
                        {c.penaltyAmount > 0
                          ? formatYen(c.penaltyAmount)
                          : "なし"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-faint">警告点</dt>
                      <dd>{c.warningPoints} 点</dd>
                    </div>
                  </dl>

                  <p className="mt-2 whitespace-pre-wrap rounded-lg bg-canvas px-3 py-2 text-xs text-ink-soft">
                    理由：{c.reason}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {c.refundIssuedToCounterpart && (
                      <span className="rounded bg-info-soft px-2 py-0.5 text-info">
                        相手へ全額返金
                      </span>
                    )}
                    {c.freeDateGrantedToCounterpart && (
                      <span className="rounded bg-success-soft px-2 py-0.5 text-success">
                        相手へ次回無料
                      </span>
                    )}
                    {c.mutualHide && (
                      <span className="rounded bg-line px-2 py-0.5 text-ink-soft">
                        以降お互い非表示
                      </span>
                    )}
                  </div>

                  {/* 対応状況：違約金の決済状況 */}
                  <div className="mt-3 border-t border-line pt-3 text-xs">
                    <span className="text-ink-faint">対応状況：</span>
                    {c.penaltyAmount === 0 ? (
                      <span className="text-ink-soft">違約金なし</span>
                    ) : penalty ? (
                      <span className="text-ink">
                        違約金{formatYen(penalty.amount)} ／{" "}
                        {PAYMENT_STATUS_LABELS[penalty.status]}
                        {(penalty.status === "PENDING" ||
                          penalty.status === "FAILED") && (
                          <span className="ml-1 text-danger">
                            （未収。決済完了まで利用停止対象）
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-warning">違約金の決済記録なし</span>
                    )}
                  </div>

                  {/* 操作 */}
                  <div className="mt-3 space-y-2 border-t border-line pt-3">
                    <form action={addWarning} className="space-y-2">
                      <input type="hidden" name="memberId" value={c.by.id} />
                      <input type="hidden" name="cancellationId" value={c.id} />
                      <div className="flex gap-2">
                        <Field label="警告点" className="w-28">
                          <Select name="points" defaultValue="1">
                            <option value="1">1 点</option>
                            <option value="2">2 点</option>
                          </Select>
                        </Field>
                        <Field label="理由" className="flex-1">
                          <Input
                            name="reason"
                            placeholder="例：当日キャンセルによる警告"
                          />
                        </Field>
                      </div>
                      <Button type="submit" size="sm" variant="secondary">
                        ペナルティ付与（警告点）
                      </Button>
                    </form>

                    <div className="flex gap-2">
                      <form action={suspend}>
                        <input type="hidden" name="memberId" value={c.by.id} />
                        <Button type="submit" size="sm" variant="outline">
                          利用停止にする
                        </Button>
                      </form>
                      <form action={forceWithdraw}>
                        <input type="hidden" name="memberId" value={c.by.id} />
                        <Button type="submit" size="sm" variant="danger">
                          強制退会にする
                        </Button>
                      </form>
                    </div>
                  </div>

                  <p className="mt-2 text-[11px] text-ink-faint">
                    マッチID：{c.matchId.slice(-8)} ／ 付与済み警告{" "}
                    {c.warnings.length} 件 ／ 登録 {formatDate(c.createdAt)}
                  </p>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
