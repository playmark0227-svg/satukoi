import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { isMessagingConfigured } from "@/lib/line";
import {
  countLineSentThisMonth,
  getAllRules,
  getLineDeliverySetting,
  startOfMonthJst,
} from "@/lib/notifications";
import { EVENT_BY_TYPE, LINE_SKIP_LABELS } from "@/lib/notification-rules";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { resetNotificationRules, saveLineDelivery, saveNotificationRules } from "./actions";

const check = "h-4 w-4 accent-primary";

/** LINE通知設定：全体スイッチ・月間上限・イベント別 ON/OFF・配信ログ */
export default async function AdminLinePage() {
  const [setting, rules, sentThisMonth, linkedMembers, followingMembers, recent, byType] =
    await Promise.all([
      getLineDeliverySetting(),
      getAllRules(),
      countLineSentThisMonth(),
      prisma.member.count({ where: { lineUserId: { not: null }, status: { not: "WITHDRAWN" } } }),
      prisma.member.count({ where: { lineFollowing: true, status: { not: "WITHDRAWN" } } }),
      prisma.notification.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { member: { select: { nickname: true } } },
      }),
      prisma.notification.groupBy({
        by: ["type"],
        where: { lineSentAt: { gte: startOfMonthJst() } },
        _count: { _all: true },
      }),
    ]);

  const configured = isMessagingConfigured();
  const limit = setting.monthlyLimit;
  const pct = limit ? Math.min(100, Math.round((sentThisMonth / limit) * 100)) : 0;
  const sentByType = new Map(byType.map((r) => [r.type, r._count._all]));

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-ink">LINE通知設定</h1>
      <p className="mb-4 text-sm text-ink-soft">
        LINE公式アカウントから送る通知を、イベントごとにON/OFFできます。配信通数（料金プラン）に合わせて月間上限も設定できます。
        アプリ内のお知らせは設定にかかわらず常に届きます。
      </p>

      {/* ── 状況 ── */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-xs font-semibold text-ink-soft">今月のLINE配信数</p>
            <p className="num-tnum mt-1 text-2xl font-bold text-ink">
              {sentThisMonth.toLocaleString("ja-JP")}
              <span className="ml-1 text-sm font-semibold text-ink-soft">
                {limit != null ? `/ ${limit.toLocaleString("ja-JP")} 通` : "通（上限なし）"}
              </span>
            </p>
            {limit != null && (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-alt">
                <div
                  className={
                    "h-full rounded-full transition-[width] duration-700 " +
                    (pct >= 90 ? "bg-danger" : pct >= 70 ? "bg-warning" : "bg-primary")
                  }
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-semibold text-ink-soft">LINE連携済みの会員</p>
            <p className="num-tnum mt-1 text-2xl font-bold text-ink">
              {linkedMembers}
              <span className="ml-1 text-sm font-semibold text-ink-soft">人</span>
            </p>
            <p className="num-tnum mt-1 text-xs text-ink-faint">うち友だち追加済み {followingMembers}人</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-semibold text-ink-soft">Messaging API</p>
            <p className="mt-2">
              {configured ? (
                <Badge tone="success">接続済み</Badge>
              ) : (
                <Badge tone="warning">未設定（送信はログのみ）</Badge>
              )}
            </p>
            <p className="mt-1.5 text-xs text-ink-faint">
              LINE_MESSAGING_CHANNEL_ACCESS_TOKEN / SECRET を設定すると実配信になります。
            </p>
          </CardBody>
        </Card>
      </div>

      {/* ── 全体設定 ── */}
      <section className="mb-6">
        <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">配信の全体設定</h2>
        <Card>
          <CardBody>
            <form action={saveLineDelivery} className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                <input type="checkbox" name="enabled" defaultChecked={setting.enabled} className={check} />
                LINE通知を配信する（OFFにすると全イベントの LINE 送信を一時停止）
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="月間の配信上限（通）" hint="空欄なら上限なし。LINE公式アカウントの料金プランの無料メッセージ通数に合わせて設定します。">
                  <Input
                    name="monthlyLimit"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    defaultValue={setting.monthlyLimit ?? ""}
                    placeholder="例：5000"
                  />
                </Field>
                <Field label="優先イベント用に残す通数" hint="残りがこの通数以下になったら、「優先」にしたイベントだけを配信します。">
                  <Input
                    name="priorityReserve"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    defaultValue={setting.priorityReserve}
                    placeholder="例：500"
                  />
                </Field>
              </div>
              <Button type="submit" size="sm">
                全体設定を保存
              </Button>
            </form>
          </CardBody>
        </Card>
      </section>

      {/* ── イベント別 ── */}
      <section className="mb-6">
        <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">イベント別の配信</h2>
        <Card>
          <form action={saveNotificationRules}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-ink-soft">
                    <th className="px-4 py-2.5 font-semibold">イベント</th>
                    <th className="px-2 py-2.5 text-center font-semibold">LINE</th>
                    <th className="px-2 py-2.5 text-center font-semibold">メール</th>
                    <th className="px-2 py-2.5 text-center font-semibold">優先</th>
                    <th className="px-4 py-2.5 text-right font-semibold">今月の配信</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rules.map((r) => (
                    <tr key={r.type}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink">
                          {r.label}
                          {r.memberToggle && (
                            <span className="ml-1.5 align-middle text-[10px] font-semibold text-ink-faint">会員も個別に設定可</span>
                          )}
                        </p>
                        <p className="text-xs text-ink-faint">{r.desc}</p>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <input type="checkbox" name={`line_${r.type}`} defaultChecked={r.rule.lineEnabled} className={check} aria-label={`${r.label}：LINE`} />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <input type="checkbox" name={`email_${r.type}`} defaultChecked={r.rule.emailEnabled} className={check} aria-label={`${r.label}：メール`} />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <input type="checkbox" name={`priority_${r.type}`} defaultChecked={r.rule.priority >= 1} className={check} aria-label={`${r.label}：優先`} />
                      </td>
                      <td className="num-tnum px-4 py-3 text-right text-ink-soft">
                        {(sentByType.get(r.type) ?? 0).toLocaleString("ja-JP")}通
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3">
              <Button type="submit" size="sm">
                イベント別の設定を保存
              </Button>
              <Button type="submit" size="sm" variant="ghost" formAction={resetNotificationRules}>
                既定値に戻す
              </Button>
            </div>
          </form>
        </Card>
      </section>

      {/* ── 最近の配信ログ ── */}
      <section>
        <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">最近の通知と LINE 配信結果</h2>
        <Card>
          {recent.length === 0 ? (
            <CardBody>
              <EmptyState title="通知はまだありません" />
            </CardBody>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((n) => (
                <li key={n.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {n.member.nickname}さん・{EVENT_BY_TYPE[n.type].label}
                    </p>
                    <p className="num-tnum text-xs text-ink-faint">{formatDateTime(n.createdAt)}</p>
                  </div>
                  <span className="shrink-0">
                    {n.lineSentAt ? (
                      <Badge tone="success">LINE送信済み</Badge>
                    ) : (
                      <Badge tone="neutral">
                        {n.lineSkipReason ? LINE_SKIP_LABELS[n.lineSkipReason] ?? n.lineSkipReason : "アプリ内のみ"}
                      </Badge>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
