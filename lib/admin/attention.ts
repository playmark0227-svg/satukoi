// ════════════════════════════════════════════════════════════════════
//  運営の「要対応」の定義（ダッシュボード・サイドバーの件数・各一覧で共通）
//  重複して数えないよう、作業の単位ごとに数える。
//    review       … 審査待ちの会員（書類確認中 または 未確認の書類がある会員。会員単位）
//    reports      … 未対応・対応中の通報
//    inquiries    … 未対応・対応中のお問い合わせ
//    matches      … 運営の対応が必要なマッチ（店舗未確定の確定デート・自動解除期限を過ぎた調整中）
//    penalties    … 違約金が未処理のキャンセル（違約金があるのに決済が完了していない：処理中・失敗・決済記録なし）
// ════════════════════════════════════════════════════════════════════

import { cache } from "react";
import { prisma } from "@/lib/db";
import { shouldAutoDissolve } from "@/lib/scheduling";
import type { MatchPhase } from "@prisma/client";

/** マッチの要対応の理由（一覧・詳細で「なぜ要対応か」を表示するのに使う） */
export type MatchAttentionReason = "NO_STORE" | "AUTO_DISSOLVE" | "UNPAID_PENALTY";

export const MATCH_ATTENTION_LABELS: Record<MatchAttentionReason, string> = {
  NO_STORE: "店舗が未確定",
  AUTO_DISSOLVE: "自動解除の期限切れ",
  UNPAID_PENALTY: "違約金が未処理",
};

export function matchAttentionReasons(m: {
  phase: MatchPhase;
  matchedAt: Date;
  lastActionAt: Date;
  hasFirstProposal: boolean;
  hasStore: boolean;
  hasDateEvent: boolean;
  unpaidPenalty: boolean;
}): MatchAttentionReason[] {
  const reasons: MatchAttentionReason[] = [];
  if (m.phase === "CONFIRMED" && m.hasDateEvent && !m.hasStore) reasons.push("NO_STORE");
  if (
    m.phase === "SCHEDULING" &&
    shouldAutoDissolve({ matchedAt: m.matchedAt, lastActionAt: m.lastActionAt, hasFirstProposal: m.hasFirstProposal })
  ) {
    reasons.push("AUTO_DISSOLVE");
  }
  if (m.unpaidPenalty) reasons.push("UNPAID_PENALTY");
  return reasons;
}

/**
 * マッチ一覧の「要対応」に数える理由か。違約金の未処理は「キャンセル・違約金」の側で数えるので除く
 * （マッチ側では理由として表示だけする）
 */
export function isMatchQueueReason(r: MatchAttentionReason) {
  return r !== "UNPAID_PENALTY";
}

/** 違約金の未処理（未収・失敗）とみなす決済の条件 */
export const UNPAID_PENALTY_WHERE = {
  purpose: { in: ["PENALTY_5500", "PENALTY_11000"] as ("PENALTY_5500" | "PENALTY_11000")[] },
  status: { in: ["PENDING", "FAILED"] as ("PENDING" | "FAILED")[] },
};

export type AttentionCounts = {
  review: number;
  reports: number;
  inquiries: number;
  matches: number;
  penalties: number;
  total: number;
};

/**
 * 違約金が未処理のキャンセルか（キャンセル・違約金の一覧の「違約金が未処理」と同じ判定）
 * 違約金があるのに、キャンセルした本人の違約金決済が完了していない（処理中・失敗・決済記録なし）
 */
export function isPenaltyUnpaid(
  c: { penaltyAmount: number },
  payment: { status: string } | null | undefined
) {
  return c.penaltyAmount > 0 && (!payment || payment.status === "PENDING" || payment.status === "FAILED");
}

/** 1回の表示（layout とページ）で同じ集計を二度しないよう、リクエスト単位でまとめる */
export const getAttentionCounts = cache(async function getAttentionCounts(): Promise<AttentionCounts> {
  const [review, reports, inquiries, activeMatches, penaltyCancellations] = await Promise.all([
    prisma.member.count({
      where: {
        OR: [{ status: "DOCUMENT_REVIEW" }, { documents: { some: { checkStatus: "PENDING" } } }],
        NOT: { status: "WITHDRAWN" },
      },
    }),
    prisma.report.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.inquiry.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.match.findMany({
      where: { phase: { in: ["SCHEDULING", "CONFIRMED"] } },
      select: {
        phase: true,
        matchedAt: true,
        lastActionAt: true,
        proposals: { select: { id: true }, take: 1 },
        dateEvent: { select: { storeId: true } },
      },
    }),
    prisma.cancellation.findMany({
      where: { penaltyAmount: { gt: 0 } },
      select: { matchId: true, byMemberId: true, penaltyAmount: true },
    }),
  ]);

  // 違約金は「キャンセル」で数えるので、マッチ側では店舗未確定・期限切れだけを数える
  const matches = activeMatches.filter(
    (m) =>
      matchAttentionReasons({
        phase: m.phase,
        matchedAt: m.matchedAt,
        lastActionAt: m.lastActionAt,
        hasFirstProposal: m.proposals.length > 0,
        hasStore: !!m.dateEvent?.storeId,
        hasDateEvent: !!m.dateEvent,
        unpaidPenalty: false,
      }).some(isMatchQueueReason)
  ).length;

  const penaltyPayments = penaltyCancellations.length
    ? await prisma.payment.findMany({
        where: {
          matchId: { in: [...new Set(penaltyCancellations.map((c) => c.matchId))] },
          purpose: { in: ["PENALTY_5500", "PENALTY_11000"] },
        },
        select: { matchId: true, memberId: true, status: true },
      })
    : [];
  const penalties = penaltyCancellations.filter((c) =>
    isPenaltyUnpaid(
      c,
      penaltyPayments.find((p) => p.matchId === c.matchId && p.memberId === c.byMemberId)
    )
  ).length;

  return {
    review,
    reports,
    inquiries,
    matches,
    penalties,
    total: review + reports + inquiries + matches + penalties,
  };
});
