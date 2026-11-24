import Link from "next/link";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/cn";
import type { MatchPhase } from "@prisma/client";
import { PageHeader, Panel, EmptyInline, RowChevron } from "@/components/admin/ui/Layout";
import { MatchPhasePill, StatusPill } from "@/components/admin/ui/Pills";
import {
  Table,
  Th,
  Td,
  rowClass,
  RowLink,
  MobileList,
  MobileRowContent,
  MemberName,
  Timestamp,
} from "@/components/admin/ui/Data";
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
import {
  isMatchQueueReason,
  matchAttentionReasons,
  MATCH_ATTENTION_LABELS,
  UNPAID_PENALTY_WHERE,
  type MatchAttentionReason,
} from "@/lib/admin/attention";
import { formatSlot } from "@/lib/format";
import { IconCalendar, IconMapPin } from "@/components/member/icons";
import { MATCH_PHASE_LABELS } from "@/lib/constants";

const PHASE_ORDER: MatchPhase[] = ["SCHEDULING", "CONFIRMED", "COMPLETED", "CANCELLED"];

/** 違約金の未処理は「キャンセル・違約金」で対応する（このページの要対応件数には含めない） */
const PENALTY_HREF = "/admin/cancellations?unpaid=1";

// 表の列の出し分け。幅に余裕がある（xl＝1280px 以上）ときだけ「要対応の理由」を独立した列にする。
// それ未満（ノートPC・タブレット横）は理由をフェーズの下にまとめる。
// 店舗は常に日時の下に置く（列を増やさず、狭い幅でも横スクロールしないように）。
const WIDE_ONLY = "hidden xl:table-cell";
const NARROW_ONLY = "xl:hidden";
/** 狭い幅ではセルの左右の余白を少し詰める（1024px でも横スクロールしないように） */
const PAD = "px-3 xl:px-4";
const PAD_FIRST = "pr-3 xl:pr-4";
/** 本名は表の幅にさらに余裕があるとき（1400px 以上）だけ。足りなければ名前の下に折り返す */
const FULLNAME_INLINE = "hidden min-[1400px]:inline";

export default async function AdminMatchesPage() {
  // 絞り込みは端末内（Filter.tsx）で行うため、サーバーは全件を最終更新の新しい順で渡す
  const matches = await prisma.match.findMany({
    orderBy: { lastActionAt: "desc" },
    include: {
      applicant: { select: { id: true, nickname: true, fullName: true } },
      receiver: { select: { id: true, nickname: true, fullName: true } },
      dateEvent: {
        select: { startAt: true, endAt: true, storeId: true, store: { select: { name: true } } },
      },
      proposals: { select: { id: true }, take: 1 },
      // 違約金の未処理決済（未収・決済失敗）
      payments: { where: UNPAID_PENALTY_WHERE, select: { id: true }, take: 1 },
    },
  });

  const rows = matches.map((m) => {
    // 理由（店舗未確定・自動解除の期限切れ・違約金の未処理）はすべて行に表示する
    const reasons = matchAttentionReasons({
      phase: m.phase,
      matchedAt: m.matchedAt,
      lastActionAt: m.lastActionAt,
      hasFirstProposal: m.proposals.length > 0,
      hasStore: !!m.dateEvent?.storeId,
      hasDateEvent: !!m.dateEvent,
      unpaidPenalty: m.payments.length > 0,
    });
    // ただし「要対応」（黄色の線・要対応のみ・件数）は、サイドバーやダッシュボードの件数と同じ定義にする。
    // 違約金の未処理は lib/admin/attention の方針どおり「キャンセル・違約金」の側で数える。
    const attention = reasons.some(isMatchQueueReason);
    return {
      ...m,
      href: `/admin/matches/${m.id}`,
      reasons,
      attention,
      // キャンセル済みは弱めに表示（理由が残っていれば目立たせる方を優先）
      muted: m.phase === "CANCELLED" && reasons.length === 0,
      slot: m.dateEvent ? splitSlot(formatSlot(m.dateEvent.startAt, m.dateEvent.endAt)) : null,
      storeName: m.dateEvent?.store?.name ?? null,
      search: [
        m.applicant.nickname,
        m.applicant.fullName,
        m.applicant.fullName.replace(/\s+/g, ""),
        m.receiver.nickname,
        m.receiver.fullName,
        m.receiver.fullName.replace(/\s+/g, ""),
        m.dateEvent?.store?.name ?? "",
      ].join(" "),
    };
  });

  const phaseCounts = Object.fromEntries(
    PHASE_ORDER.map((p) => [p, rows.filter((r) => r.phase === p).length])
  ) as Record<MatchPhase, number>;
  const attentionCount = rows.filter((r) => r.attention).length;

  return (
    <div>
      <PageHeader
        title={navLabel("matches")}
        description="マッチの状態・日程調整・店舗確定・キャンセル対応を管理します。"
      />

      {rows.length === 0 ? (
        <Panel>
          <EmptyInline>成立したマッチはまだありません</EmptyInline>
        </Panel>
      ) : (
        <FilterScope params={["phase", "attention"]}>
          <FilterBar>
            {/* スマホでは検索欄と「要対応のみ」を1行に並べる */}
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1 lg:flex-none">
                <SearchField placeholder="名前・店舗で検索" label="マッチを検索" />
              </div>
              <ToggleChip name="attention" label="要対応のみ" count={attentionCount} />
            </div>
            <div className="min-w-0 lg:border-l lg:border-line lg:pl-3">
              <FilterChips
                name="phase"
                label="フェーズ"
                allCount={rows.length}
                options={PHASE_ORDER.map((p) => ({
                  value: p,
                  label: MATCH_PHASE_LABELS[p],
                  count: phaseCounts[p],
                }))}
              />
            </div>
          </FilterBar>

          <FilterSummary unit="件" />

          {/* PC：表（名前は会員詳細へのリンク。行のそれ以外の場所を押すとマッチ詳細） */}
          <Table
            head={
              <>
                <Th className={PAD_FIRST}>組み合わせ</Th>
                <Th className={PAD}>
                  フェーズ<span className={NARROW_ONLY}>・要対応の理由</span>
                </Th>
                <Th className={PAD}>デート日時・店舗</Th>
                <Th className={cn(PAD, WIDE_ONLY)}>要対応の理由</Th>
                <Th className={PAD}>最終更新</Th>
                <Th className="w-10">
                  <span className="sr-only">詳細</span>
                </Th>
              </>
            }
          >
            {rows.map((m) => (
              <FilterRow
                key={m.id}
                id={m.id}
                as="tr"
                search={m.search}
                facets={{ phase: m.phase, attention: m.attention }}
                className={rowClass({ attention: m.attention, muted: m.muted })}
              >
                <Td className={cn("py-2.5", PAD_FIRST)}>
                  <Pair applicant={m.applicant} receiver={m.receiver} muted={m.muted} table />
                </Td>
                <Td className={PAD}>
                  <MatchPhasePill phase={m.phase} />
                  {m.reasons.length > 0 && (
                    <div className={cn("mt-1.5", NARROW_ONLY)}>
                      <Reasons reasons={m.reasons} />
                    </div>
                  )}
                </Td>
                <Td className={cn("num-tnum", PAD)}>
                  <SlotText slot={m.slot} />
                  {m.dateEvent && (
                    <div className="mt-0.5 text-[13px] text-ink-soft">
                      {m.storeName ?? "店舗未確定"}
                    </div>
                  )}
                </Td>
                <Td className={cn(PAD, WIDE_ONLY)}>
                  <Reasons reasons={m.reasons} />
                </Td>
                <Td className={cn("whitespace-nowrap", PAD)}>
                  <Timestamp date={m.lastActionAt} />
                </Td>
                <Td className="pr-4 pl-0 text-right">
                  <RowLink href={m.href} className="inline-flex align-middle">
                    <span className="sr-only">
                      {m.applicant.nickname}さんと{m.receiver.nickname}さんのマッチ詳細
                    </span>
                    <RowChevron />
                  </RowLink>
                </Td>
              </FilterRow>
            ))}
          </Table>

          {/* スマホ：カード行（名前 → フェーズ・理由 → 日時・店舗 → 最終更新） */}
          <MobileList>
            {rows.map((m) => (
              <FilterRow
                key={m.id}
                id={m.id}
                as="li"
                search={m.search}
                facets={{ phase: m.phase, attention: m.attention }}
              >
                <MobileRowContent
                  attention={m.attention}
                  muted={m.muted}
                  title={<Pair applicant={m.applicant} receiver={m.receiver} muted={m.muted} />}
                  meta={
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <MatchPhasePill phase={m.phase} />
                      {m.reasons.map((r) => (
                        <ReasonPill key={r} reason={r} />
                      ))}
                    </div>
                  }
                  below={
                    <div className="num-tnum space-y-0.5 text-[13px] text-ink-soft">
                      {/* 日時と店舗は1行に。入りきらなければ店舗だけ次の行へ（店舗名の途中では切らない） */}
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">
                          <IconCalendar className="h-3.5 w-3.5 shrink-0" />
                          <span className="sr-only">デート</span>
                          {m.slot ? (
                            <span className={m.muted ? undefined : "text-ink"}>{m.slot.join("")}</span>
                          ) : (
                            "日程未確定"
                          )}
                        </span>
                        {m.dateEvent && (
                          <span className="inline-flex min-w-0 items-center gap-1">
                            <IconMapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="sr-only">店舗</span>
                            <span className={m.storeName && !m.muted ? "text-ink" : undefined}>
                              {m.storeName ?? "店舗未確定"}
                            </span>
                          </span>
                        )}
                      </p>
                      <p>
                        最終更新 <Timestamp date={m.lastActionAt} />
                      </p>
                    </div>
                  }
                  right={
                    // 行全体のリンク（名前のリンクは z-10 でこの上に乗る）
                    <Link href={m.href} className="after:absolute after:inset-0">
                      <span className="sr-only">
                        {m.applicant.nickname}さんと{m.receiver.nickname}さんのマッチ詳細
                      </span>
                      <RowChevron />
                    </Link>
                  }
                />
              </FilterRow>
            ))}
          </MobileList>

          <FilterEmpty>条件に合うマッチはありません</FilterEmpty>
        </FilterScope>
      )}
    </div>
  );
}

/** 「11/28（土）19:00〜20:00」を日付と時刻に分ける（狭い列では日付の後で折り返せるように） */
function splitSlot(slot: string): [string, string] {
  const i = slot.indexOf("）") + 1;
  return i > 0 ? [slot.slice(0, i), slot.slice(i)] : [slot, ""];
}

function SlotText({ slot }: { slot: [string, string] | null }) {
  if (!slot) return <span className="text-ink-soft">未確定</span>;
  return (
    <span>
      <span className="whitespace-nowrap">{slot[0]}</span>
      <wbr />
      <span className="whitespace-nowrap">{slot[1]}</span>
    </span>
  );
}

type PairMember = { id: string; nickname: string; fullName: string };

/**
 * 申込会員・申受会員を2行で。名前は会員詳細へのリンク（行全体のリンクより手前に出る）。
 * 役割（申込／申受）の右に名前をそろえ、表の幅が広いときは本名も添える（狭ければ名前の下に折り返す）。
 */
function Pair({
  applicant,
  receiver,
  muted,
  table = false,
}: {
  applicant: PairMember;
  receiver: PairMember;
  muted?: boolean;
  table?: boolean;
}) {
  const lines: [string, PairMember][] = [
    ["申込", applicant],
    ["申受", receiver],
  ];
  return (
    <span className="grid grid-cols-[auto_1fr] items-baseline gap-x-1.5 gap-y-0.5 font-normal">
      {lines.map(([role, member]) => (
        <span key={role} className="contents">
          <span className="text-xs font-medium text-ink-soft">{role}</span>
          {/* min-w-0 を付けない（表の列幅が名前より狭くならないように） */}
          <span className="flex flex-wrap items-baseline gap-x-1">
            <MemberName
              member={member}
              full={false}
              className={cn("min-w-fit shrink-0 flex-nowrap whitespace-nowrap", muted && "[&_a]:text-ink-soft")}
            />
            <span className={cn("text-[13px] whitespace-nowrap text-ink-soft", table ? FULLNAME_INLINE : undefined)}>
              （{member.fullName}）
            </span>
          </span>
        </span>
      ))}
    </span>
  );
}

/** 理由のピル（狭い列では縦に積む） */
function Reasons({ reasons }: { reasons: MatchAttentionReason[] }) {
  if (reasons.length === 0) {
    return (
      <span className="text-ink-faint" aria-label="なし">
        —
      </span>
    );
  }
  return (
    <div className="flex flex-wrap gap-1">
      {reasons.map((r) => (
        <ReasonPill key={r} reason={r} />
      ))}
    </div>
  );
}

/**
 * 理由のピル。違約金の未処理は「キャンセル・違約金」（違約金が未処理で絞り込み）へのリンクにして、
 * どこで対応するかが分かるようにする（行全体のリンクより手前に出す）。
 */
function ReasonPill({ reason }: { reason: MatchAttentionReason }) {
  if (reason === "UNPAID_PENALTY") {
    return (
      <Link
        href={PENALTY_HREF}
        title="キャンセル・違約金のページで対応します"
        className="relative z-10 inline-flex rounded-full hover:underline"
      >
        <StatusPill tone="warning" dot={false} className="gap-1 pr-1.5">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
            {MATCH_ATTENTION_LABELS[reason]}
          </span>
          <span className="sr-only">（キャンセル・違約金で対応）</span>
          <RowChevron className="h-3.5 w-3.5 text-current" />
        </StatusPill>
      </Link>
    );
  }
  return <StatusPill tone="warning">{MATCH_ATTENTION_LABELS[reason]}</StatusPill>;
}
