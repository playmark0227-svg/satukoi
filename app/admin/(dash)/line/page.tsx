import { prisma } from "@/lib/db";
import { cn } from "@/lib/cn";
import { isMessagingConfigured } from "@/lib/line";
import {
  countLineSentThisMonth,
  getAllRules,
  getLineDeliverySetting,
  startOfMonthJst,
} from "@/lib/notifications";
import { EVENT_BY_TYPE, LINE_SKIP_LABELS } from "@/lib/notification-rules";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { PageHeader, Section, Panel, Callout, EmptyInline } from "@/components/admin/ui/Layout";
import { StatusPill, Tag } from "@/components/admin/ui/Pills";
import {
  StatTile,
  Table,
  Th,
  Td,
  rowClass,
  MobileList,
  MobileRowContent,
  MemberName,
  Timestamp,
} from "@/components/admin/ui/Data";
import { navLabel } from "@/lib/admin/nav";
import type { AdminTone } from "@/lib/admin/tones";
import { resetNotificationRules, saveLineDelivery, saveNotificationRules } from "./actions";

const check = "h-4 w-4 shrink-0 cursor-pointer accent-primary";

/** イベント別の表（PC）の列幅。見出し行と各行で同じ値を使う */
const ruleGrid = "lg:grid lg:grid-cols-[minmax(0,1fr)_88px_88px_88px_112px] lg:items-center lg:gap-x-2";

/** LINE を送らなかった理由の色。運営が見直すもの（設定・上限）は warning、送信エラーは danger、会員側の事情は neutral */
const SKIP_TONE: Record<string, AdminTone> = {
  SEND_FAILED: "danger",
  DELIVERY_OFF: "warning",
  NOT_CONFIGURED: "warning",
  LIMIT_REACHED: "warning",
  RESERVED_FOR_PRIORITY: "warning",
};

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
        include: { member: { select: { id: true, nickname: true, fullName: true } } },
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
  const remaining = limit != null ? Math.max(0, limit - sentThisMonth) : null;
  const limitReached = remaining === 0;
  // 残りが優先枠以下 → 優先イベントだけ配信（lib/notifications の判定と同じ）
  const priorityOnly =
    remaining != null && remaining > 0 && setting.priorityReserve > 0 && remaining <= setting.priorityReserve;
  const sentByType = new Map(byType.map((r) => [r.type, r._count._all]));

  const headerStatus = !setting.enabled ? (
    <StatusPill tone="danger" size="md">
      配信停止中
    </StatusPill>
  ) : !configured ? (
    <StatusPill tone="warning" size="md">
      未接続（ログのみ）
    </StatusPill>
  ) : (
    <StatusPill tone="success" size="md">
      配信中
    </StatusPill>
  );

  return (
    <div>
      <PageHeader
        title={navLabel("line")}
        status={headerStatus}
        description="LINE公式アカウントから送る通知を、イベントごとにON/OFFできます。アプリ内のお知らせは、この設定にかかわらず常に届きます。"
      />

      {/* ── 重要な状態（統計カードに埋もれさせない） ── */}
      {!setting.enabled && (
        <Callout
          tone="danger"
          title="LINE通知の配信を停止しています"
          action={
            <ButtonLink href="#delivery" variant="outline" size="sm">
              全体設定へ
            </ButtonLink>
          }
        >
          全イベントの LINE 送信を一時停止中です（アプリ内のお知らせは届いています）。再開するには「配信の全体設定」で ON にして保存してください。
        </Callout>
      )}
      {!configured && (
        <Callout tone="warning" title="Messaging API が未設定のため、LINE は実際には送信されません（ログのみ）">
          環境変数{" "}
          <code className="font-mono text-[13px] [overflow-wrap:anywhere]">LINE_MESSAGING_CHANNEL_ACCESS_TOKEN</code> と{" "}
          <code className="font-mono text-[13px] [overflow-wrap:anywhere]">LINE_MESSAGING_CHANNEL_SECRET</code>{" "}
          を設定すると、実際に LINE へ配信されます。
        </Callout>
      )}
      {setting.enabled && limitReached && (
        <Callout tone="danger" title={`今月の配信上限（${limit?.toLocaleString("ja-JP")}通）に達しました`}>
          上限に達したあとの通知は LINE を送らず、アプリ内のお知らせだけになります。月が替わると配信数は 0 に戻ります。
        </Callout>
      )}
      {setting.enabled && priorityOnly && (
        <Callout tone="warning" title={`残り ${remaining?.toLocaleString("ja-JP")} 通のため、「優先」のイベントだけを配信しています`}>
          優先枠（{setting.priorityReserve.toLocaleString("ja-JP")}通）以下になると、優先でないイベントの LINE は見送られます。
        </Callout>
      )}

      {/* ── 状況 ── */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile
          className="col-span-2 lg:col-span-1"
          label="今月の LINE 配信"
          value={sentThisMonth}
          unit={limit != null ? `/ ${limit.toLocaleString("ja-JP")} 通` : "通"}
          meter={limit != null ? pct : undefined}
          sub={
            remaining != null ? (
              <span className="num-tnum">
                残り {remaining.toLocaleString("ja-JP")} 通（{pct}% 使用）
              </span>
            ) : (
              "月間の上限なし"
            )
          }
        />
        <StatTile label="LINE連携済みの会員" value={linkedMembers} unit="人" sub="退会者を除く" />
        <StatTile label="友だち追加済み" value={followingMembers} unit="人" sub="公式アカウントを友だち追加" />
      </div>

      {/* ── 全体設定 ── */}
      <Section title="配信の全体設定" id="delivery">
        <Panel tone={setting.enabled ? "default" : "danger"} className="max-w-3xl">
          <form action={saveLineDelivery}>
            {/* 全体スイッチ（チェックボックスをスイッチの見た目に。name="enabled" はそのまま）。
                ピルは保存済みの状態。スイッチを動かして保存前なら、CSS（:has）で「未保存」の注意を出す */}
            <label
              className={cn(
                "group/sw flex cursor-pointer items-start justify-between gap-4 border-b border-line p-4",
                setting.enabled
                  ? "has-[input[name=enabled]:not(:checked)]:bg-warning-soft/50"
                  : "has-[input[name=enabled]:checked]:bg-warning-soft/50"
              )}
            >
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] font-bold text-ink">
                  LINE通知を配信する
                  {setting.enabled ? (
                    <StatusPill tone="success">保存済み：ON</StatusPill>
                  ) : (
                    <StatusPill tone="danger">保存済み：OFF（停止中）</StatusPill>
                  )}
                </span>
                <span className="mt-1 block text-[13px] text-ink-soft">
                  OFF にすると、全イベントの LINE 送信を一時停止します。アプリ内のお知らせは届きます。
                </span>
                <span
                  className={cn(
                    "mt-1.5 hidden text-[13px] font-semibold text-warning-strong",
                    setting.enabled
                      ? "group-has-[input[name=enabled]:not(:checked)]/sw:block"
                      : "group-has-[input[name=enabled]:checked]/sw:block"
                  )}
                >
                  まだ保存されていません。下の「全体設定を保存」を押すと {setting.enabled ? "OFF" : "ON"} になります。
                </span>
              </span>
              <span className="relative mt-0.5 inline-flex shrink-0 items-center gap-2">
                <input
                  type="checkbox"
                  role="switch"
                  name="enabled"
                  defaultChecked={setting.enabled}
                  className="peer sr-only"
                />
                <span aria-hidden className="w-7 text-right text-[13px] font-bold text-ink-soft peer-checked:hidden">
                  OFF
                </span>
                <span aria-hidden className="hidden w-7 text-right text-[13px] font-bold text-primary-text peer-checked:inline">
                  ON
                </span>
                <span
                  aria-hidden
                  className="relative h-7 w-12 rounded-full bg-line transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary after:absolute after:top-0.5 after:left-0.5 after:h-6 after:w-6 after:rounded-full after:bg-surface after:shadow after:transition-transform peer-checked:after:translate-x-5"
                />
              </span>
            </label>

            <div className="grid gap-4 p-4 md:grid-cols-2">
              <Field
                label="月間の配信上限"
                hint="空欄なら上限なし。LINE公式アカウントの料金プランの無料メッセージ通数に合わせて設定します。"
              >
                <span className="flex items-center gap-2">
                  <Input
                    name="monthlyLimit"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    defaultValue={setting.monthlyLimit ?? ""}
                    placeholder="例：5000"
                    className="h-10 w-36"
                  />
                  <span className="text-sm text-ink-soft">通</span>
                </span>
              </Field>
              <Field
                label="優先イベント用に残す通数"
                hint="残りがこの通数以下になったら、「優先」にしたイベントだけを配信します。"
              >
                <span className="flex items-center gap-2">
                  <Input
                    name="priorityReserve"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    defaultValue={setting.priorityReserve}
                    placeholder="例：500"
                    className="h-10 w-36"
                  />
                  <span className="text-sm text-ink-soft">通</span>
                </span>
              </Field>
            </div>
            <div className="border-t border-line px-4 py-3">
              <Button type="submit" size="md">
                全体設定を保存
              </Button>
            </div>
          </form>
        </Panel>
      </Section>

      {/* ── イベント別 ── */}
      <Section title="イベント別の配信" id="events">
        <p className="-mt-1 mb-3 max-w-3xl text-[13px] text-ink-soft">
          チェックした方法で通知します。「優先」にしたイベントは、残りが優先枠以下になっても LINE の配信を続けます。
        </p>
        <Panel>
          <form action={saveNotificationRules}>
            {/* 見出し行（PC のみ） */}
            <div
              aria-hidden
              className={cn(
                "hidden border-b border-line bg-canvas px-4 py-2.5 text-xs font-semibold text-ink-soft",
                ruleGrid
              )}
            >
              <span>イベント</span>
              <span className="text-center">LINE</span>
              <span className="text-center">メール</span>
              <span className="text-center" title="月間上限が近づいても配信を続けるイベント">
                優先
              </span>
              <span className="text-right">今月の LINE 配信</span>
            </div>
            <ul className="divide-y divide-line">
              {rules.map((r) => {
                const sent = sentByType.get(r.type) ?? 0;
                return (
                  <li key={r.type} className={cn("px-4 py-3", ruleGrid)}>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-ink">
                        {r.label}
                        {r.memberToggle && <Tag>会員も個別に設定可</Tag>}
                      </p>
                      <p className="mt-0.5 text-[13px] text-ink-soft">{r.desc}</p>
                    </div>
                    {/* スマホ：ラベル付きのチェックを横並び／PC：各列に配置（lg:contents） */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 lg:contents">
                      <RuleCheck name={`line_${r.type}`} label="LINE" aria={`${r.label}：LINE`} checked={r.rule.lineEnabled} />
                      <RuleCheck name={`email_${r.type}`} label="メール" aria={`${r.label}：メール`} checked={r.rule.emailEnabled} />
                      <RuleCheck name={`priority_${r.type}`} label="優先" aria={`${r.label}：優先`} checked={r.rule.priority >= 1} />
                      <span
                        className={cn(
                          "num-tnum ml-auto text-[13px] lg:ml-0 lg:text-right lg:text-sm",
                          sent > 0 ? "font-semibold text-ink" : "text-ink-soft"
                        )}
                      >
                        <span className="lg:sr-only">今月 </span>
                        {sent.toLocaleString("ja-JP")}通
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            {/* 「既定値に戻す」は確認なしで全イベントを上書きするので、主ボタンから離して軽い見た目に */}
            <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3">
              <Button type="submit" size="md">
                イベント別の設定を保存
              </Button>
              <Button
                type="submit"
                size="md"
                variant="ghost"
                formAction={resetNotificationRules}
                className="ml-auto text-ink-soft"
              >
                既定値に戻す
              </Button>
            </div>
          </form>
        </Panel>
      </Section>

      {/* ── 最近の配信ログ ── */}
      <Section
        title="最近の通知と LINE 配信結果"
        action={recent.length > 0 ? <span className="num-tnum text-[13px] text-ink-soft">最新 {recent.length} 件</span> : undefined}
      >
        {recent.length === 0 ? (
          <Panel>
            <EmptyInline>通知はまだありません</EmptyInline>
          </Panel>
        ) : (
          <>
            <Table
              head={
                <>
                  <Th className="w-44">日時</Th>
                  <Th>会員</Th>
                  <Th>イベント</Th>
                  <Th>LINE 配信</Th>
                </>
              }
            >
              {recent.map((n) => (
                <tr key={n.id} className={rowClass({ clickable: false })}>
                  <Td className="whitespace-nowrap text-ink-soft">
                    <Timestamp date={n.createdAt} />
                  </Td>
                  <Td>
                    <MemberName member={n.member} />
                  </Td>
                  <Td>{EVENT_BY_TYPE[n.type].label}</Td>
                  <Td>
                    <LineResultPill sentAt={n.lineSentAt} reason={n.lineSkipReason} />
                  </Td>
                </tr>
              ))}
            </Table>

            <MobileList>
              {recent.map((n) => (
                <li key={n.id}>
                  <MobileRowContent
                    title={EVENT_BY_TYPE[n.type].label}
                    meta={
                      <span className="flex flex-wrap items-baseline gap-x-1.5">
                        <MemberName member={n.member} full={false} />
                        <span aria-hidden>・</span>
                        <Timestamp date={n.createdAt} />
                      </span>
                    }
                    below={
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] text-ink-soft">LINE</span>
                        <LineResultPill sentAt={n.lineSentAt} reason={n.lineSkipReason} />
                      </span>
                    }
                  />
                </li>
              ))}
            </MobileList>
          </>
        )}
      </Section>
    </div>
  );
}

/** イベント別のチェック。スマホでは「LINE / メール / 優先」の文字を横に出す（PC は列見出しがあるので隠す） */
function RuleCheck({ name, label, aria, checked }: { name: string; label: string; aria: string; checked: boolean }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-ink lg:justify-center">
      <input type="checkbox" name={name} defaultChecked={checked} className={check} aria-label={aria} />
      <span className="lg:sr-only">{label}</span>
    </label>
  );
}

/** LINE 配信結果。送信済みは success、送らなかった理由は SKIP_TONE の色 */
function LineResultPill({ sentAt, reason }: { sentAt: Date | null; reason: string | null }) {
  if (sentAt) return <StatusPill tone="success">送信済み</StatusPill>;
  if (!reason) return <StatusPill tone="neutral">アプリ内のみ</StatusPill>;
  return <StatusPill tone={SKIP_TONE[reason] ?? "neutral"}>{LINE_SKIP_LABELS[reason] ?? reason}</StatusPill>;
}
