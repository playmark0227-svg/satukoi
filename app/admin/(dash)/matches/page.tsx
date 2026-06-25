import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { MatchPhaseBadge } from "@/components/ui/StatusBadge";
import { formatDateTime, formatSlot } from "@/lib/format";
import { shouldAutoDissolve } from "@/lib/scheduling";
import { MATCH_PHASE_LABELS } from "@/lib/constants";
import type { MatchPhase } from "@prisma/client";


const PHASE_ORDER: MatchPhase[] = [
  "SCHEDULING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
];

type MatchForList = Awaited<ReturnType<typeof loadMatches>>[number];

async function loadMatches() {
  return prisma.match.findMany({
    orderBy: { lastActionAt: "desc" },
    include: {
      applicant: { select: { id: true, nickname: true } },
      receiver: { select: { id: true, nickname: true } },
      dateEvent: { select: { startAt: true, endAt: true, storeId: true } },
      proposals: { select: { id: true }, take: 1 },
      payments: {
        where: {
          purpose: { in: ["PENALTY_5500", "PENALTY_11000"] },
          status: { in: ["PENDING", "FAILED"] },
        },
        select: { id: true },
        take: 1,
      },
    },
  });
}

/**
 * 要対応フラグ：運営の対応が必要なマッチを判定する。
 * - 調整中で自動解除条件に達している（7日無提示／48時間無反応）
 * - 日程確定なのに店舗が未確定
 * - 違約金の未処理決済（PENDING/FAILED）がある
 */
function needsAttention(m: MatchForList): boolean {
  if (m.payments.length > 0) return true;
  if (m.phase === "SCHEDULING") {
    return shouldAutoDissolve({
      matchedAt: m.matchedAt,
      lastActionAt: m.lastActionAt,
      hasFirstProposal: m.proposals.length > 0,
    });
  }
  if (m.phase === "CONFIRMED" && m.dateEvent && !m.dateEvent.storeId) {
    return true;
  }
  return false;
}

export default async function AdminMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ phase?: string; attention?: string }>;
}) {
  const sp = await searchParams;
  const phaseFilter =
    sp.phase && PHASE_ORDER.includes(sp.phase as MatchPhase)
      ? (sp.phase as MatchPhase)
      : null;
  const attentionOnly = sp.attention === "1";

  const all = await loadMatches();

  let rows = all;
  if (phaseFilter) rows = rows.filter((m) => m.phase === phaseFilter);
  if (attentionOnly) rows = rows.filter((m) => needsAttention(m));

  const attentionCount = all.filter((m) => needsAttention(m)).length;

  function tabHref(phase: MatchPhase | null) {
    const p = new URLSearchParams();
    if (phase) p.set("phase", phase);
    if (attentionOnly) p.set("attention", "1");
    const q = p.toString();
    return q ? `/admin/matches?${q}` : "/admin/matches";
  }

  function attentionHref(next: boolean) {
    const p = new URLSearchParams();
    if (phaseFilter) p.set("phase", phaseFilter);
    if (next) p.set("attention", "1");
    const q = p.toString();
    return q ? `/admin/matches?${q}` : "/admin/matches";
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-ink">マッチ＆デート管理</h1>
      <p className="mb-4 text-sm text-ink-soft">
        マッチの状態遷移・日程調整・店舗確定・キャンセル対応を管理します（全 {all.length} 件）。
      </p>

      {/* フェーズ並び替え（絞り込みタブ） */}
      <div className="mb-3 flex flex-wrap gap-2">
        <PhaseTab label="すべて" href={tabHref(null)} active={!phaseFilter} />
        {PHASE_ORDER.map((p) => (
          <PhaseTab
            key={p}
            label={MATCH_PHASE_LABELS[p]}
            href={tabHref(p)}
            active={phaseFilter === p}
          />
        ))}
      </div>

      {/* 要対応のみ抽出 */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={attentionHref(!attentionOnly)}
          className={
            attentionOnly
              ? "inline-flex items-center gap-2 rounded-full border border-warning bg-warning-soft px-3.5 py-1.5 text-sm font-bold text-ink"
              : "inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-ink-soft hover:bg-canvas"
          }
        >
          <span
            className={
              attentionOnly
                ? "h-4 w-4 rounded border border-warning bg-warning text-center text-[10px] leading-4 text-white"
                : "h-4 w-4 rounded border border-line text-center text-[10px] leading-4"
            }
          >
            {attentionOnly ? "✓" : ""}
          </span>
          要対応のみ表示
          <Badge tone={attentionCount > 0 ? "warning" : "neutral"}>
            {attentionCount}件
          </Badge>
        </Link>
        <span className="text-xs text-ink-faint">該当 {rows.length} 件</span>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon="📋"
              title="該当するマッチがありません"
              description="絞り込み条件を変更してください。"
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((m) => {
            const attention = needsAttention(m);
            return (
              <Link key={m.id} href={`/admin/matches/${m.id}`} className="block">
                <Card className="transition hover:border-primary-soft">
                  <CardBody>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <MatchPhaseBadge phase={m.phase} />
                          {attention && <Badge tone="warning">要対応</Badge>}
                        </div>
                        <p className="truncate text-sm font-bold text-ink">
                          {m.applicant.nickname}さん（申込）
                          <span className="mx-1 text-ink-faint">×</span>
                          {m.receiver.nickname}さん（申受）
                        </p>
                        <p className="mt-1 text-xs text-ink-faint">
                          マッチID：{m.id.slice(-8)}
                        </p>
                        <p className="mt-1 text-xs text-ink-soft">
                          {m.dateEvent
                            ? `デート：${formatSlot(m.dateEvent.startAt, m.dateEvent.endAt)}`
                            : "デート日時：未確定"}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-faint">
                          最終更新 {formatDateTime(m.lastActionAt)}
                        </p>
                      </div>
                      <span className="ml-2 shrink-0 self-center text-sm text-primary">
                        →
                      </span>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PhaseTab({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-primary px-3.5 py-1.5 text-sm font-bold text-white"
          : "rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-ink-soft hover:bg-canvas"
      }
    >
      {label}
    </Link>
  );
}
