import Link from "next/link";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/cn";
import type { CancellationCategory } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input, Select } from "@/components/ui/Input";
import { IconChevronRight } from "@/components/member/icons";
import { PageHeader, Panel, EmptyInline } from "@/components/admin/ui/Layout";
import { StatusPill, Tag, PaymentStatusPill, MemberStatusPill } from "@/components/admin/ui/Pills";
import { MemberName, Timestamp } from "@/components/admin/ui/Data";
import {
  FilterScope,
  FilterBar,
  SearchField,
  FilterChips,
  ToggleChip,
  FilterSummary,
  FilterRow,
  FilterEmpty,
} from "@/components/admin/ui/Filter";
import { navLabel } from "@/lib/admin/nav";
import { isPenaltyUnpaid } from "@/lib/admin/attention";
import { CANCELLATION_CATEGORY_LABELS, WARNING_RULES } from "@/lib/constants";
import { formatYen, formatSlot } from "@/lib/format";
import { addWarning, suspend, forceWithdraw } from "./actions";

const CATEGORY_ORDER: CancellationCategory[] = ["BEFORE_24H", "H24_TO_2H", "WITHIN_2H_OR_NOSHOW"];

/** 要対応の行の左に出す黄色の線（一覧の rowClass と同じ表現） */
const ATTENTION_LINE = "shadow-[inset_3px_0_0_var(--color-warning)]";

export default async function AdminCancellationsPage() {
  // 絞り込みは端末内（Filter.tsx）で行うため、サーバーは全件を新しい順で渡す
  const cancellations = await prisma.cancellation.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      by: { select: { id: true, nickname: true, fullName: true, status: true } },
      match: {
        select: {
          id: true,
          applicantId: true,
          receiverId: true,
          applicant: { select: { id: true, nickname: true, fullName: true } },
          receiver: { select: { id: true, nickname: true, fullName: true } },
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
    warningPointsByMember.set(w.memberId, (warningPointsByMember.get(w.memberId) ?? 0) + w.points);
  }

  const rows = cancellations.map((c) => {
    const penalty = penaltyPayments.find((p) => p.matchId === c.matchId && p.memberId === c.byMemberId);
    const activePoints = warningPointsByMember.get(c.byMemberId) ?? 0;
    // 違約金があるのに決済が完了していない（処理中・失敗・決済記録なし）
    const unpaid = isPenaltyUnpaid(c, penalty);
    // 警告点が決まっているのに、このキャンセルに紐づく警告がまだない
    const warningNotIssued = c.warningPoints > 0 && c.warnings.length === 0;
    const consequences = [
      c.refundIssuedToCounterpart && "相手へ全額返金",
      c.freeDateGrantedToCounterpart && "相手へ次回デート無料",
      c.mutualHide && "以降お互い非表示",
    ].filter((t): t is string => !!t);
    const { applicant, receiver, dateEvent } = c.match;
    return {
      ...c,
      penalty,
      activePoints,
      willForceWithdraw: activePoints >= WARNING_RULES.FORCED_WITHDRAWAL_POINTS,
      unpaid,
      warningNotIssued,
      attention: unpaid || warningNotIssued,
      consequences,
      slot: dateEvent ? formatSlot(dateEvent.startAt, dateEvent.endAt) : null,
      search: [
        c.by.nickname,
        c.by.fullName,
        c.by.fullName.replace(/\s+/g, ""),
        applicant.nickname,
        applicant.fullName,
        receiver.nickname,
        receiver.fullName,
        c.reason,
      ].join(" "),
    };
  });

  const unpaidCount = rows.filter((r) => r.unpaid).length;
  const unissuedCount = rows.filter((r) => r.warningNotIssued).length;
  const withdrawCount = rows.filter((r) => r.willForceWithdraw).length;
  const categoryCounts = Object.fromEntries(
    CATEGORY_ORDER.map((k) => [k, rows.filter((r) => r.category === k).length])
  ) as Record<CancellationCategory, number>;

  return (
    <div>
      <PageHeader
        title={navLabel("cancellations")}
        description="デートのキャンセル履歴と違約金の決済状況を確認し、警告点の付与・利用停止・強制退会を行います。"
        meta={
          <>
            <span>警告点は付与日から1年間有効</span>
            <span>
              1年以内に合計 <b className="font-semibold text-ink">{WARNING_RULES.FORCED_WITHDRAWAL_POINTS} 点</b>
              以上で強制退会の対象
            </span>
          </>
        }
      />

      {rows.length === 0 ? (
        <Panel>
          <EmptyInline>キャンセルはまだありません</EmptyInline>
        </Panel>
      ) : (
        <FilterScope params={["unpaid", "unissued", "withdraw", "category"]}>
          {/* 1行目：検索と「対応が必要なもの」の絞り込み（横に並べるのは xl 以上。lg では縦に積む） */}
          <FilterBar className="mb-3 lg:flex-col lg:items-start xl:flex-row xl:items-center">
            <SearchField placeholder="名前・理由で検索" label="キャンセルを検索" />
            <div className="flex flex-wrap gap-2">
              <ToggleChip name="unpaid" label="違約金が未処理" count={unpaidCount} />
              <ToggleChip name="unissued" label="警告点が未付与" count={unissuedCount} />
              <ToggleChip name="withdraw" label="強制退会の対象" count={withdrawCount} />
            </div>
          </FilterBar>
          {/* 2行目：キャンセルの区分（スマホでも折り返して全部見せる） */}
          <div className="mb-4 flex items-start gap-2 [&_[role=radiogroup]]:mx-0 [&_[role=radiogroup]]:flex-wrap [&_[role=radiogroup]]:px-0">
            <span className="flex h-8 shrink-0 items-center text-[13px] text-ink-soft">区分</span>
            <FilterChips
              name="category"
              label="キャンセルの区分"
              allCount={rows.length}
              options={CATEGORY_ORDER.map((k) => ({
                value: k,
                label: CANCELLATION_CATEGORY_LABELS[k],
                count: categoryCounts[k],
              }))}
            />
          </div>

          <FilterSummary unit="件" />

          <ul className="flex flex-col gap-3">
            {rows.map((c) => (
              <FilterRow
                key={c.id}
                id={c.id}
                as="li"
                search={c.search}
                facets={{
                  unpaid: c.unpaid,
                  unissued: c.warningNotIssued,
                  withdraw: c.willForceWithdraw,
                  category: c.category,
                }}
              >
                <Panel className={cn(c.attention && ATTENTION_LINE)}>
                  {/* 見出し帯：キャンセルした人・区分・要対応の理由 ／ 日時・マッチへのリンク */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-4 py-2.5">
                    <h3 className="text-[15px] leading-snug">
                      <MemberName member={c.by} />
                    </h3>
                    <Tag className="text-[13px] text-ink">{CANCELLATION_CATEGORY_LABELS[c.category]}のキャンセル</Tag>
                    {c.unpaid && <StatusPill tone="warning">違約金が未処理</StatusPill>}
                    {c.warningNotIssued && <StatusPill tone="warning">警告点が未付与</StatusPill>}
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-soft xl:ml-auto">
                      <span>
                        キャンセル <Timestamp date={c.createdAt} className="text-ink" />
                      </span>
                      <Link
                        href={`/admin/matches/${c.matchId}`}
                        className="inline-flex items-center font-semibold text-primary-text hover:underline"
                      >
                        マッチ詳細
                        <IconChevronRight className="h-4 w-4" />
                      </Link>
                    </span>
                  </div>

                  <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_18rem]">
                    {/* 誰が・どのマッチを・なぜ */}
                    <div className="min-w-0 space-y-3">
                      <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-baseline gap-x-3 gap-y-2 text-sm">
                        <dt className="text-[13px] text-ink-soft">会員の状態</dt>
                        <dd className="min-w-0">
                          <MemberStatusPill status={c.by.status} />
                        </dd>
                        <dt className="text-[13px] text-ink-soft">マッチ</dt>
                        <dd className="flex min-w-0 flex-col gap-0.5">
                          <MemberName member={c.match.applicant} role="申込" full={false} />
                          <MemberName member={c.match.receiver} role="申受" full={false} />
                        </dd>
                        <dt className="text-[13px] text-ink-soft">デート予定</dt>
                        <dd className={cn("num-tnum", c.slot ? "text-ink" : "text-ink-soft")}>{c.slot ?? "未確定"}</dd>
                      </dl>

                      <div>
                        <p className="text-[13px] text-ink-soft">キャンセル理由</p>
                        <p className="mt-0.5 text-sm leading-relaxed whitespace-pre-wrap text-ink">{c.reason}</p>
                      </div>

                      {c.consequences.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[13px] text-ink-soft">自動の対応</span>
                          {c.consequences.map((t) => (
                            <Tag key={t}>{t}</Tag>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 違約金・警告点（キャンセル者への措置） */}
                    <dl className="space-y-3 self-start rounded-lg bg-canvas p-3">
                      <div>
                        <dt className="text-[13px] text-ink-soft">違約金</dt>
                        <dd className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                          {c.penaltyAmount > 0 ? (
                            <>
                              <span className="num-tnum text-lg leading-tight font-bold text-ink">
                                {formatYen(c.penalty?.amount ?? c.penaltyAmount)}
                              </span>
                              {c.penalty ? (
                                <PaymentStatusPill status={c.penalty.status} />
                              ) : (
                                <StatusPill tone="warning">決済記録なし</StatusPill>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-ink-soft">なし</span>
                          )}
                        </dd>
                        {c.unpaid && c.penalty && (
                          <p className="mt-1 text-xs text-ink-soft">決済が完了するまで利用停止の対象です</p>
                        )}
                      </div>
                      <div>
                        <dt className="text-[13px] text-ink-soft">警告点</dt>
                        <dd className="mt-0.5">
                          <p className="flex flex-wrap items-baseline gap-x-2">
                            <span className="text-sm text-ink">
                              今回 <b className="num-tnum text-lg leading-tight">{c.warningPoints}</b> 点
                            </span>
                            {c.warningPoints > 0 && (
                              <span className="text-xs text-ink-soft">
                                {c.warnings.length > 0 ? `付与済み ${c.warnings.length} 件` : "未付与"}
                              </span>
                            )}
                          </p>
                          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-soft">
                            <span>
                              1年以内の累計{" "}
                              <b className={cn("num-tnum", c.willForceWithdraw ? "text-danger-strong" : "text-ink")}>
                                {c.activePoints}
                              </b>{" "}
                              / {WARNING_RULES.FORCED_WITHDRAWAL_POINTS} 点
                            </span>
                            {c.willForceWithdraw && <StatusPill tone="danger">強制退会の対象</StatusPill>}
                          </p>
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* 操作（要対応・強制退会の対象なら最初から開く。それ以外は畳む） */}
                  <details className="group border-t border-line" open={c.attention || c.willForceWithdraw}>
                    <summary className="flex cursor-pointer list-none items-center gap-1 px-4 py-2.5 text-[13px] font-semibold text-primary-text select-none hover:bg-canvas [&::-webkit-details-marker]:hidden">
                      <IconChevronRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                      対応（警告点の付与・利用停止・強制退会）
                    </summary>
                    <div className="space-y-4 px-4 pt-1 pb-4">
                      <form action={addWarning} className="flex max-w-3xl flex-wrap items-end gap-3">
                        <input type="hidden" name="memberId" value={c.by.id} />
                        <input type="hidden" name="cancellationId" value={c.id} />
                        <Field label="警告点" className="w-24">
                          <Select name="points" defaultValue={c.warningPoints >= 2 ? "2" : "1"} className="h-10">
                            <option value="1">1 点</option>
                            <option value="2">2 点</option>
                          </Select>
                        </Field>
                        <Field label="理由" className="min-w-0 flex-1 basis-48">
                          <Input name="reason" className="h-10" placeholder="例：直前のキャンセル" />
                        </Field>
                        <Button type="submit" size="md" variant="secondary">
                          警告点を付与
                        </Button>
                      </form>

                      {/* 会員の状態は上の「会員の状態」欄に出している */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-3 border-t border-line-soft pt-3">
                        <form action={suspend}>
                          <input type="hidden" name="memberId" value={c.by.id} />
                          <Button type="submit" size="md" variant="outline">
                            利用停止にする
                          </Button>
                        </form>
                        {/* 取り返しのつかない操作は離して置く */}
                        <div className="flex w-full items-center gap-3 border-t border-line-soft pt-3 sm:ml-auto sm:w-auto sm:border-t-0 sm:border-l sm:pt-0 sm:pl-3">
                          <span className="text-xs font-semibold text-danger-strong">危険な操作</span>
                          <form action={forceWithdraw}>
                            <input type="hidden" name="memberId" value={c.by.id} />
                            <Button type="submit" size="md" variant="danger-outline">
                              強制退会にする
                            </Button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </details>
                </Panel>
              </FilterRow>
            ))}
          </ul>

          <FilterEmpty>条件に合うキャンセルはありません</FilterEmpty>
        </FilterScope>
      )}
    </div>
  );
}
