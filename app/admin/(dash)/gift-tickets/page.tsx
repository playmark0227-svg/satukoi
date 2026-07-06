import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  GIFT_TICKET_AMOUNT,
  GIFT_TICKET_REASON_LABELS,
  GIFT_TICKET_STATUS_LABELS,
} from "@/lib/constants";
import { formatDate, formatYen } from "@/lib/format";
import { issueGiftTicket, markUsed } from "./actions";

const STATUS_TONE = {
  ACTIVE: "success",
  USED: "neutral",
  EXPIRED: "neutral",
} as const;

export default async function AdminGiftTicketsPage() {
  const [tickets, members] = await Promise.all([
    prisma.giftTicket.findMany({
      orderBy: { issuedAt: "desc" },
      include: { member: { select: { nickname: true } } },
    }),
    prisma.member.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, nickname: true, fullName: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-ink">提携店ギフト券</h1>
      <p className="mb-4 text-sm text-ink-soft">
        お友達紹介・キャンペーン・補償として発行する金券を管理します（全{" "}
        {tickets.length} 件）。会員は店頭でコードを提示し、提携店からの利用報告を受けて「使用済み」に更新します。
      </p>

      <section className="mb-6">
        <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">発行済み一覧</h2>
        {tickets.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon="🎫"
                title="ギフト券はまだ発行されていません"
                description="下のフォームから会員に発行できます。"
              />
            </CardBody>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-ink-faint">
                    <th className="px-4 py-2.5 font-bold">会員</th>
                    <th className="px-4 py-2.5 font-bold">コード</th>
                    <th className="px-4 py-2.5 font-bold">金額</th>
                    <th className="px-4 py-2.5 font-bold">理由</th>
                    <th className="px-4 py-2.5 font-bold">状態</th>
                    <th className="px-4 py-2.5 font-bold">発行日</th>
                    <th className="px-4 py-2.5 font-bold">期限</th>
                    <th className="px-4 py-2.5 font-bold">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {tickets.map((t) => (
                    <tr key={t.id} className="text-ink">
                      <td className="px-4 py-2.5 font-bold">
                        {t.member.nickname}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs">{t.code}</td>
                      <td className="num-tnum px-4 py-2.5">
                        {formatYen(t.amount)}
                      </td>
                      <td className="px-4 py-2.5 text-ink-soft">
                        {GIFT_TICKET_REASON_LABELS[t.reason]}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge tone={STATUS_TONE[t.status]}>
                          {GIFT_TICKET_STATUS_LABELS[t.status]}
                        </Badge>
                      </td>
                      <td className="num-tnum px-4 py-2.5 text-ink-soft">
                        {formatDate(t.issuedAt)}
                      </td>
                      <td className="num-tnum px-4 py-2.5 text-ink-soft">
                        {t.expiresAt ? formatDate(t.expiresAt) : "無期限"}
                      </td>
                      <td className="px-4 py-2.5">
                        {t.status === "ACTIVE" ? (
                          <form action={markUsed}>
                            <input type="hidden" name="id" value={t.id} />
                            <Button type="submit" size="sm" variant="outline">
                              使用済みにする
                            </Button>
                          </form>
                        ) : (
                          <span className="num-tnum text-xs text-ink-faint">
                            {t.usedAt ? `${formatDate(t.usedAt)} 使用` : "ー"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">
          新規発行
        </h2>
        <Card>
          <CardBody>
            <form action={issueGiftTicket} className="space-y-3">
              <Field label="発行先の会員" required>
                <Select name="memberId" required defaultValue="">
                  <option value="" disabled>
                    会員を選択してください
                  </option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nickname}（{m.fullName}）
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="金額（円）" required>
                  <Input
                    type="number"
                    name="amount"
                    defaultValue={GIFT_TICKET_AMOUNT}
                    min={1}
                    step={100}
                    required
                  />
                </Field>
                <Field label="発行理由" required>
                  <Select name="reason" defaultValue="REFERRAL" required>
                    {Object.entries(GIFT_TICKET_REASON_LABELS).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    )}
                  </Select>
                </Field>
                <Field label="有効期限" hint="発行日からの期間">
                  <Select name="expiresInMonths" defaultValue="6">
                    <option value="3">3ヶ月</option>
                    <option value="6">6ヶ月</option>
                    <option value="12">12ヶ月</option>
                    <option value="0">無期限</option>
                  </Select>
                </Field>
              </div>
              <Field label="メモ・備考" hint="対象キャンペーン名など（運営向け）">
                <Textarea
                  name="note"
                  placeholder="例：2026年夏キャンペーン"
                  rows={2}
                />
              </Field>
              <Button type="submit">ギフト券を発行</Button>
            </form>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
