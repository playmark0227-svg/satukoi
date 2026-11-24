import { prisma } from "@/lib/db";
import type { GiftTicketStatus } from "@prisma/client";
import { cn } from "@/lib/cn";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { PageHeader, Section, Panel, PanelBody, EmptyInline } from "@/components/admin/ui/Layout";
import { GiftTicketStatusPill } from "@/components/admin/ui/Pills";
import {
  StatTile,
  Table,
  Th,
  Td,
  rowClass,
  MobileList,
  MemberName,
  Timestamp,
} from "@/components/admin/ui/Data";
import {
  FilterScope,
  FilterBar,
  SearchField,
  FilterChips,
  FilterSummary,
  FilterRow,
  FilterEmpty,
} from "@/components/admin/ui/Filter";
import { navLabel } from "@/lib/admin/nav";
import {
  GIFT_TICKET_AMOUNT,
  GIFT_TICKET_REASON_LABELS,
  GIFT_TICKET_STATUS_LABELS,
} from "@/lib/constants";
import { issueGiftTicket, markUsed } from "./actions";

const STATUS_VALUES = Object.keys(GIFT_TICKET_STATUS_LABELS) as GiftTicketStatus[];

/** 利用可能のまま有効期限を過ぎたか（表示用） */
function isPastDue(expiresAt: Date | null) {
  return expiresAt != null && expiresAt.getTime() < Date.now();
}

export default async function AdminGiftTicketsPage() {
  // 絞り込みは端末内（Filter.tsx）で行うため、サーバーは全件を新しい発行順で渡す
  const [tickets, members] = await Promise.all([
    prisma.giftTicket.findMany({
      orderBy: { issuedAt: "desc" },
      include: { member: { select: { id: true, nickname: true, fullName: true } } },
    }),
    prisma.member.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, nickname: true, fullName: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const rows = tickets.map((t) => ({
    ...t,
    reasonLabel: GIFT_TICKET_REASON_LABELS[t.reason],
    overdue: t.status === "ACTIVE" && isPastDue(t.expiresAt),
    search: [
      t.code,
      t.member.nickname,
      t.member.fullName,
      t.member.fullName.replace(/\s+/g, ""),
      GIFT_TICKET_REASON_LABELS[t.reason],
      t.note ?? "",
    ].join(" "),
  }));

  const byStatus = (s: GiftTicketStatus) => rows.filter((t) => t.status === s);
  const sum = (list: { amount: number }[]) => list.reduce((a, t) => a + t.amount, 0);
  const active = byStatus("ACTIVE");
  const used = byStatus("USED");
  const expired = byStatus("EXPIRED");

  return (
    <div>
      <PageHeader
        title={navLabel("gift-tickets")}
        description="お友達紹介・キャンペーン・補償として会員に発行する、提携店で使える金券です。"
        actions={
          <ButtonLink href="#create" size="md">
            ＋ ギフト券を発行
          </ButtonLink>
        }
      />

      {/* 要点 */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="利用可能" value={active.length} unit="枚" sub="提携店で使えるギフト券" />
        <StatTile label="利用可能の合計額" value={sum(active)} unit="円" sub="まだ使われていない金額" />
        <StatTile
          label="使用済み"
          value={used.length}
          unit="枚"
          sub={<span className="num-tnum">合計 {sum(used).toLocaleString("ja-JP")}円</span>}
        />
        <StatTile
          label="期限切れ"
          value={expired.length}
          unit="枚"
          sub={<span className="num-tnum">合計 {sum(expired).toLocaleString("ja-JP")}円</span>}
        />
      </div>

      <Section title="発行済みのギフト券">
        {rows.length > 0 && (
          <p className="-mt-1 mb-3 max-w-3xl text-[13px] text-ink-soft">
            会員は店頭でコードを提示します。提携店から利用報告を受けたら「使用済みにする」を押してください。
          </p>
        )}
        {rows.length === 0 ? (
          <Panel>
            <EmptyInline>ギフト券はまだ発行されていません。下のフォームから会員に発行できます。</EmptyInline>
          </Panel>
        ) : (
          <FilterScope params={["status"]}>
            <FilterBar>
              <SearchField placeholder="コード・会員名で検索" label="ギフト券を検索" />
              <div className="min-w-0 lg:border-l lg:border-line lg:pl-3">
                <FilterChips
                  name="status"
                  label="状態"
                  allCount={rows.length}
                  options={STATUS_VALUES.map((s) => ({
                    value: s,
                    label: GIFT_TICKET_STATUS_LABELS[s],
                    count: byStatus(s).length,
                  }))}
                />
              </div>
            </FilterBar>

            <FilterSummary unit="枚" />

            {/* PC（xl 以上）：表。列が多いので 1024〜1279px はカード行で表示 */}
            <Table
              className="lg:hidden xl:block"
              head={
                <>
                  <Th>会員</Th>
                  <Th>コード・発行理由</Th>
                  <Th align="right">金額</Th>
                  <Th>状態</Th>
                  <Th>発行日</Th>
                  <Th>有効期限</Th>
                  <Th align="right">操作</Th>
                </>
              }
            >
              {rows.map((t) => (
                <FilterRow
                  key={t.id}
                  id={t.id}
                  as="tr"
                  search={t.search}
                  facets={{ status: t.status }}
                  className={rowClass({ muted: t.status !== "ACTIVE", clickable: false })}
                >
                  <Td>
                    <MemberName member={t.member} />
                  </Td>
                  <Td>
                    <p className="font-mono text-sm font-semibold tracking-wide whitespace-nowrap">{t.code}</p>
                    {/* 理由（とメモ）はコードの下に全文を折り返して表示（列を減らして 1280px でも表が収まるように） */}
                    <p className="mt-0.5 max-w-64 text-[13px] text-ink-soft [overflow-wrap:anywhere] 2xl:max-w-80">
                      {t.reasonLabel}
                      {t.note && `・${t.note}`}
                    </p>
                  </Td>
                  <Td align="right" className="whitespace-nowrap font-semibold">
                    {t.amount.toLocaleString("ja-JP")}
                    <span className="ml-0.5 text-[13px] font-normal">円</span>
                  </Td>
                  <Td>
                    <GiftTicketStatusPill status={t.status} />
                  </Td>
                  <Td className="whitespace-nowrap">
                    <Timestamp date={t.issuedAt} dateOnly />
                  </Td>
                  <Td className="whitespace-nowrap">
                    <Expiry expiresAt={t.expiresAt} overdue={t.overdue} />
                  </Td>
                  <Td align="right" className="whitespace-nowrap">
                    <TicketAction ticket={t} />
                  </Td>
                </FilterRow>
              ))}
            </Table>

            {/* スマホ〜xl 未満：カード行（状態と操作が見える） */}
            <MobileList className="lg:block xl:hidden">
              {rows.map((t) => {
                const muted = t.status !== "ACTIVE";
                return (
                  <FilterRow
                    key={t.id}
                    id={t.id}
                    as="li"
                    search={t.search}
                    facets={{ status: t.status }}
                    className={cn("px-4 py-3", muted && "bg-canvas/60")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p
                        className={cn(
                          "min-w-0 font-mono text-[15px] font-semibold tracking-wide [overflow-wrap:anywhere]",
                          muted ? "text-ink-soft" : "text-ink"
                        )}
                      >
                        {t.code}
                      </p>
                      <GiftTicketStatusPill status={t.status} />
                    </div>
                    <div className="num-tnum mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[13px] text-ink-soft">
                      <MemberName member={t.member} full={false} />
                      <span aria-hidden>・</span>
                      <span className={cn("font-semibold", muted ? "text-ink-soft" : "text-ink")}>
                        {t.amount.toLocaleString("ja-JP")}円
                      </span>
                      <span aria-hidden>・</span>
                      <span>{t.reasonLabel}</span>
                    </div>
                    {t.note && <p className="mt-0.5 text-[13px] text-ink-soft">{t.note}</p>}
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="num-tnum flex flex-wrap gap-x-3 text-[13px] text-ink-soft">
                        <span>
                          発行 <Timestamp date={t.issuedAt} dateOnly />
                        </span>
                        <span>
                          期限 <Expiry expiresAt={t.expiresAt} overdue={t.overdue} />
                        </span>
                      </p>
                      <div className="shrink-0">
                        <TicketAction ticket={t} />
                      </div>
                    </div>
                  </FilterRow>
                );
              })}
            </MobileList>

            <FilterEmpty>条件に合うギフト券はありません</FilterEmpty>
          </FilterScope>
        )}
      </Section>

      <Section title="ギフト券を発行" id="create">
        <Panel className="max-w-3xl">
          <PanelBody>
            <form action={issueGiftTicket} className="space-y-3">
              <Field label="発行先の会員" required className="md:max-w-md">
                <Select name="memberId" required defaultValue="" className="h-10">
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
                    className="h-10"
                  />
                </Field>
                <Field label="発行理由" required>
                  <Select name="reason" defaultValue="REFERRAL" required className="h-10">
                    {Object.entries(GIFT_TICKET_REASON_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="有効期限" hint="発行日からの期間">
                  <Select name="expiresInMonths" defaultValue="6" className="h-10">
                    <option value="3">3ヶ月</option>
                    <option value="6">6ヶ月</option>
                    <option value="12">12ヶ月</option>
                    <option value="0">無期限</option>
                  </Select>
                </Field>
              </div>
              <Field label="メモ・備考" hint="対象キャンペーン名など（運営向け）">
                <Textarea name="note" placeholder="例：2026年夏キャンペーン" rows={2} className="min-h-20" />
              </Field>
              <Button type="submit" size="md">
                ギフト券を発行
              </Button>
            </form>
          </PanelBody>
        </Panel>
      </Section>
    </div>
  );
}

/** 有効期限（無期限・期限超過の表示を含む） */
function Expiry({ expiresAt, overdue }: { expiresAt: Date | null; overdue: boolean }) {
  if (!expiresAt) return <span className="text-ink-soft">無期限</span>;
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <Timestamp date={expiresAt} dateOnly />
      {overdue && <span className="text-[13px] font-semibold text-danger-strong">期限超過</span>}
    </span>
  );
}

/** 操作：利用可能なら「使用済みにする」、使用済みなら使用日 */
function TicketAction({
  ticket,
}: {
  ticket: { id: string; status: GiftTicketStatus; usedAt: Date | null };
}) {
  if (ticket.status === "ACTIVE") {
    return (
      <form action={markUsed}>
        <input type="hidden" name="id" value={ticket.id} />
        <Button type="submit" size="sm" variant="outline">
          使用済みにする
        </Button>
      </form>
    );
  }
  if (ticket.usedAt) {
    return (
      <span className="text-[13px] text-ink-soft">
        <Timestamp date={ticket.usedAt} dateOnly /> 使用
      </span>
    );
  }
  return <span className="text-ink-soft">—</span>;
}
