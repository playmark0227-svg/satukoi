// ════════════════════════════════════════════════════════════════════
//  日程調整・キャンセルの業務ルール（純粋関数）
//  仕様書「日程調整フロー」「キャンセルポリシー」を実装。
//  ここはサーバ処理・バッチ・テストから共通利用する想定。
// ════════════════════════════════════════════════════════════════════

import { PRICING, SCHEDULING_RULES } from "@/lib/constants";

export type CancellationCategory =
  | "BEFORE_24H"
  | "H24_TO_2H"
  | "WITHIN_2H_OR_NOSHOW";

/**
 * デート開始時刻と操作時刻から、キャンセル区分を判定する。
 * - 24時間より前　→ BEFORE_24H
 * - 24時間前〜2時間前 → H24_TO_2H
 * - 2時間前以降（無断・20分超遅刻含む） → WITHIN_2H_OR_NOSHOW
 */
export function classifyCancellation(
  dateStart: Date,
  actionAt: Date = new Date()
): CancellationCategory {
  const hoursUntil = (dateStart.getTime() - actionAt.getTime()) / 3_600_000;
  if (hoursUntil >= SCHEDULING_RULES.RESCHEDULE_CUTOFF_HOURS) return "BEFORE_24H";
  if (hoursUntil >= 2) return "H24_TO_2H";
  return "WITHIN_2H_OR_NOSHOW";
}

export interface CancellationOutcome {
  category: CancellationCategory;
  /** キャンセル者へ請求する違約金（円） */
  penaltyAmount: number;
  /** 相手側へ全額返金するか */
  refundToCounterpart: boolean;
  /** キャンセル者への警告点 */
  warningPoints: number;
  /** 相手へ次回デート1回無料を付与するか */
  freeDateToCounterpart: boolean;
  /** 以降お互い非表示にするか */
  mutualHide: boolean;
  /** 日程変更（調整中に戻す）が可能か */
  canReschedule: boolean;
}

/** キャンセル区分ごとの返金・違約金・警告を確定する（運営最終判断で上書き可）。 */
export function resolveCancellationOutcome(
  category: CancellationCategory
): CancellationOutcome {
  switch (category) {
    case "BEFORE_24H":
      return {
        category,
        penaltyAmount: 0,
        refundToCounterpart: true,
        warningPoints: 0,
        freeDateToCounterpart: false,
        mutualHide: false,
        canReschedule: true,
      };
    case "H24_TO_2H":
      return {
        category,
        penaltyAmount: PRICING.PENALTY_24H_2H,
        refundToCounterpart: true,
        warningPoints: 1,
        freeDateToCounterpart: false,
        mutualHide: false,
        canReschedule: false,
      };
    case "WITHIN_2H_OR_NOSHOW":
      return {
        category,
        penaltyAmount: PRICING.PENALTY_NOSHOW,
        refundToCounterpart: true,
        warningPoints: 2,
        freeDateToCounterpart: true,
        mutualHide: true,
        canReschedule: false,
      };
  }
}

/**
 * 自動キャンセル（マッチ自動解除）すべきか。
 * - 候補未提示：マッチ成立後 7日以内に提示がなければ解除
 * - 調整中：最後のアクションから 48時間でアクションがなければ解除
 */
export function shouldAutoDissolve(params: {
  matchedAt: Date;
  lastActionAt: Date;
  hasFirstProposal: boolean;
  now?: Date;
}): boolean {
  const now = params.now ?? new Date();
  if (!params.hasFirstProposal) {
    const hours = (now.getTime() - params.matchedAt.getTime()) / 3_600_000;
    return hours >= SCHEDULING_RULES.FIRST_PROPOSAL_DEADLINE_HOURS;
  }
  const hours = (now.getTime() - params.lastActionAt.getTime()) / 3_600_000;
  return hours >= SCHEDULING_RULES.RESPONSE_DEADLINE_HOURS;
}

/** デート代の支払いが無料になるか（サロン会員 or 紹介特典保有）。 */
export function isDateFeeWaived(member: {
  accountType: "NORMAL" | "SALON";
  referralBonusRemaining: number;
}): { waived: boolean; reason?: string } {
  if (member.accountType === "SALON")
    return { waived: true, reason: "サロン会員" };
  if (member.referralBonusRemaining > 0)
    return { waived: true, reason: "紹介特典" };
  return { waived: false };
}

/** 候補が規定件数（3件以上）あるか。 */
export function hasEnoughCandidates(count: number): boolean {
  return count >= SCHEDULING_RULES.MIN_CANDIDATES;
}
