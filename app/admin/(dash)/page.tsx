import { Fragment } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/cn";
import { navLabel } from "@/lib/admin/nav";
import {
  getAttentionCounts,
  isMatchQueueReason,
  matchAttentionReasons,
  MATCH_ATTENTION_LABELS,
  UNPAID_PENALTY_WHERE,
} from "@/lib/admin/attention";
import { PageHeader, Section, SectionLink, Panel, EmptyInline, RowChevron } from "@/components/admin/ui/Layout";
import { StatTile, MemberName, Timestamp } from "@/components/admin/ui/Data";
import { CountPill, MatchPhasePill } from "@/components/admin/ui/Pills";

/** 日本時間での「今月1日 0:00」と、その表示（例：11/1 以降）。サーバーのタイムゾーンに依存しない */
function thisMonthInJst() {
  const jst = new Date(Date.now() + 9 * 3_600_000);
  const y = jst.getUTCFullYear();
  const m = jst.getUTCMonth();
  return {
    start: new Date(Date.UTC(y, m, 1) - 9 * 3_600_000),
    label: `${m + 1}/1 以降`,
  };
}

export default async function AdminDashboardPage() {
  const month = thisMonthInJst();

  const [
    attention,
    totalMembers,
    maleMembers,
    femaleMembers,
    newThisMonth,
    completedDates,
    activeStores,
    totalStores,
    recentMatches,
  ] = await Promise.all([
    // サイドバーの件数バッジと同じ定義（lib/admin/attention）
    getAttentionCounts(),
    prisma.member.count(),
    prisma.member.count({ where: { sex: "MALE" } }),
    prisma.member.count({ where: { sex: "FEMALE" } }),
    prisma.member.count({ where: { createdAt: { gte: month.start } } }),
    prisma.match.count({ where: { phase: "COMPLETED" } }),
    prisma.store.count({ where: { isActive: true } }),
    prisma.store.count(),
    prisma.match.findMany({
      orderBy: { lastActionAt: "desc" },
      take: 5,
      select: {
        id: true,
        phase: true,
        matchedAt: true,
        lastActionAt: true,
        applicant: { select: { id: true, nickname: true, fullName: true } },
        receiver: { select: { id: true, nickname: true, fullName: true } },
        proposals: { select: { id: true }, take: 1 },
        dateEvent: { select: { storeId: true } },
        payments: { where: UNPAID_PENALTY_WHERE, select: { id: true }, take: 1 },
      },
    }),
  ]);

  // 対応待ちの一覧（並びはメニューと同じ）。リンク先は該当の絞り込み・見出しを開いた状態
  const queue = [
    {
      key: "review",
      label: "審査待ちの|会員",
      value: attention.review,
      unit: "名",
      sub: "書類の確認待ち",
      href: "/admin/members?review=1",
    },
    {
      key: "matches",
      label: "対応待ちの|マッチ",
      value: attention.matches,
      unit: "件",
      // 理由の言い方はマッチ一覧の「要対応の理由」（MATCH_ATTENTION_LABELS）とそろえる
      sub: "店舗未確定・|自動解除の|期限切れ",
      href: "/admin/matches?attention=1",
    },
    {
      key: "penalties",
      label: "未処理の|違約金",
      value: attention.penalties,
      unit: "件",
      // キャンセル・違約金の「違約金が未処理」と同じ定義（決済が処理中・失敗・記録なし）
      sub: "決済が|完了していない",
      href: "/admin/cancellations?unpaid=1",
    },
    {
      key: "reports",
      label: "通報",
      value: attention.reports,
      unit: "件",
      sub: "未対応・|対応中",
      href: "/admin/reports#reports",
    },
    {
      key: "inquiries",
      label: "お問い|合わせ",
      value: attention.inquiries,
      unit: "件",
      sub: "未対応・|対応中",
      href: "/admin/reports#inquiries",
    },
  ];

  return (
    <div>
      <PageHeader
        title={navLabel("dashboard")}
        description="対応待ちの件数と、サービスの概況です。"
      />

      <Section
        title={
          <>
            要対応
            <CountPill n={attention.total} className="text-[13px] leading-6" />
          </>
        }
        action={
          attention.total === 0 ? (
            <span className="text-[13px] font-semibold text-success-strong">対応待ちはありません</span>
          ) : undefined
        }
      >
        {/* 5枚を空きなく並べる：スマホ 2+2+1（最後は全幅）、タブレット〜ノート PC 3+2（下段は幅広）、xl 以上 5列 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-6 xl:grid-cols-5">
          {queue.map((q, i) => (
            <div
              key={q.key}
              className={cn(
                i < 3 ? "sm:col-span-2" : "sm:col-span-3",
                "xl:col-span-1",
                i === queue.length - 1 && "max-sm:col-span-2"
              )}
            >
              <StatTile
                tone="queue"
                label={<Phrase text={q.label} />}
                value={q.value}
                unit={q.unit}
                sub={<Phrase text={q.sub} />}
                href={q.href}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="概況">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="総会員数"
            value={totalMembers}
            unit="名"
            href="/admin/members"
            sub={<Phrase text={`男性\u00a0${maleMembers}名・|女性\u00a0${femaleMembers}名`} />}
          />
          <StatTile
            label={<Phrase text="今月の|登録数" />}
            value={newThisMonth}
            unit="名"
            href="/admin/members"
            sub={month.label}
          />
          <StatTile
            label={<Phrase text="デート|実施件数" />}
            value={completedDates}
            unit="件"
            href="/admin/matches"
            sub={<Phrase text="実施済みの|累計" />}
          />
          <StatTile
            label={<Phrase text="稼働中の|店舗" />}
            value={activeStores}
            unit="店舗"
            href="/admin/stores"
            sub={<Phrase text={`登録\u00a0${totalStores}店舗中`} />}
          />
        </div>
      </Section>

      <Section title="最近のマッチ" action={<SectionLink href="/admin/matches">すべて見る</SectionLink>}>
        <Panel>
          {recentMatches.length === 0 ? (
            <EmptyInline>マッチはまだありません。</EmptyInline>
          ) : (
            <ul className="divide-y divide-line">
              {recentMatches.map((m) => {
                const reasons = matchAttentionReasons({
                  phase: m.phase,
                  matchedAt: m.matchedAt,
                  lastActionAt: m.lastActionAt,
                  hasFirstProposal: m.proposals.length > 0,
                  hasStore: !!m.dateEvent?.storeId,
                  hasDateEvent: !!m.dateEvent,
                  unpaidPenalty: m.payments.length > 0,
                });
                // 黄色の線は「対応待ちのマッチ」と同じ定義（違約金はキャンセル側で数える）。理由はすべて表示する
                const attentionNeeded = reasons.some(isMatchQueueReason);
                // キャンセル済みは弱めに（理由が残っていれば目立たせる方を優先。マッチ一覧と同じ）
                const muted = m.phase === "CANCELLED" && reasons.length === 0;
                return (
                  <li
                    key={m.id}
                    className={cn(
                      "relative flex items-center gap-3 px-4 py-3 hover:bg-canvas",
                      attentionNeeded && "shadow-[inset_3px_0_0_var(--color-warning)]",
                      muted && "bg-canvas/60 [&_a]:text-ink-soft"
                    )}
                  >
                    {/* 行全体をマッチ詳細へのリンクに（会員名のリンクと日時は手前に重ねる） */}
                    <Link
                      href={`/admin/matches/${m.id}`}
                      aria-label={`${m.applicant.nickname}さん × ${m.receiver.nickname}さん のマッチ詳細`}
                      className="absolute inset-0"
                    />
                    {/*
                      スマホ：1行目に名前、2行目に状態・日時・要対応の理由
                      lg：状態｜名前｜日時（理由は名前の下）。名前の列は上限を決め、余白は行の右端に寄せる
                      xl：状態｜名前（本名つき）｜日時｜理由
                    */}
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1 lg:grid lg:grid-cols-[7.5rem_minmax(0,24rem)_11.5rem] lg:gap-x-4 lg:gap-y-0.5 xl:grid-cols-[7.5rem_minmax(0,24rem)_11.5rem_minmax(0,1fr)]">
                      <p className="w-full min-w-0 text-[15px] lg:col-start-2 lg:row-start-1 lg:w-auto lg:text-sm">
                        <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
                          <PairMember member={m.applicant} />
                          <span className="inline-flex items-baseline gap-x-1.5">
                            <span aria-hidden className="text-ink-soft">
                              ×
                            </span>
                            <PairMember member={m.receiver} />
                          </span>
                        </span>
                      </p>
                      <div className="lg:col-start-1 lg:row-start-1">
                        <MatchPhasePill phase={m.phase} />
                      </div>
                      <p className="text-[13px] whitespace-nowrap text-ink-soft lg:col-start-3 lg:row-start-1">
                        最終更新 <Timestamp date={m.lastActionAt} className="relative z-10" />
                      </p>
                      {reasons.length > 0 && (
                        <p className="text-[13px] font-semibold text-warning-strong lg:col-start-2 lg:row-start-2 xl:col-start-4 xl:row-start-1">
                          {reasons.map((r) => MATCH_ATTENTION_LABELS[r]).join("・")}
                        </p>
                      )}
                    </div>
                    <RowChevron />
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </Section>
    </div>
  );
}

/**
 * 狭い画面でも語の途中で改行しないよう、「|」の位置でだけ折り返す
 * （例：「デート|実施件数」は「デート実施件／数」ではなく「デート／実施件数」で改行）
 */
function Phrase({ text }: { text: string }) {
  return (
    <span className="[overflow-wrap:anywhere] [word-break:keep-all]">
      {text.split("|").map((part, i) => (
        <Fragment key={i}>
          {i > 0 && <wbr />}
          {part}
        </Fragment>
      ))}
    </span>
  );
}

/** 最近のマッチの会員名。xl 以上は余白があるので本名も添える（マッチ一覧の表記とそろえる） */
function PairMember({ member }: { member: { id: string; nickname: string; fullName: string } }) {
  return (
    <span className="inline-flex items-baseline gap-x-1 whitespace-nowrap">
      <MemberName member={member} full={false} />
      <span className="hidden text-[13px] font-normal text-ink-soft xl:inline">（{member.fullName}）</span>
    </span>
  );
}
