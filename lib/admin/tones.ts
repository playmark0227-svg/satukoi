// ════════════════════════════════════════════════════════════════════
//  運営管理画面の色の意味（全ページ共通。ページごとに色を決めない）
//    warning … 運営の対応待ち（書類確認中・未対応・未収・要対応）
//    danger  … 問題・失敗・違反（停止・NG・決済失敗・違約金・送信エラー）
//    success … 完了・有効（有効・公開中・稼働中・対応完了・送信済み・利用可能）
//    primary … 確定・進行中（日程確定）
//    violet  … 調整中（日程調整中・一部返金）
//    neutral … 終了・無効（退会・非公開・キャンセル・使用済み）
//  文字色は淡い地の上でも読める濃さ（-strong / primary-text）を使う。
// ════════════════════════════════════════════════════════════════════

import type {
  DocumentCheckStatus,
  GiftTicketStatus,
  MatchPhase,
  MemberStatus,
  PaymentStatus,
  ReportStatus,
  InquiryStatus,
} from "@prisma/client";

export type AdminTone = "warning" | "danger" | "success" | "primary" | "violet" | "neutral";

/** ピル（淡い地＋濃い文字） */
export const TONE_PILL: Record<AdminTone, string> = {
  warning: "bg-warning-soft text-warning-strong",
  danger: "bg-danger-soft text-danger-strong",
  success: "bg-success-soft text-success-strong",
  primary: "bg-primary-soft text-primary-text",
  violet: "bg-violet-soft text-violet",
  neutral: "bg-surface-alt text-ink-soft",
};

/** 数字・アイコンなど文字だけで色を使うとき */
export const TONE_TEXT: Record<AdminTone, string> = {
  warning: "text-warning-strong",
  danger: "text-danger-strong",
  success: "text-success-strong",
  primary: "text-primary-text",
  violet: "text-violet",
  neutral: "text-ink-soft",
};

export const memberStatusTone: Record<MemberStatus, AdminTone> = {
  DOCUMENT_REVIEW: "warning",
  ACTIVE: "success",
  SUSPENDED: "danger",
  WITHDRAWN: "neutral",
};

export const matchPhaseTone: Record<MatchPhase, AdminTone> = {
  SCHEDULING: "violet",
  CONFIRMED: "primary",
  COMPLETED: "success",
  CANCELLED: "neutral",
};

export const docCheckTone: Record<DocumentCheckStatus, AdminTone> = {
  PENDING: "warning",
  OK: "success",
  NG: "danger",
};

export const paymentStatusTone: Record<PaymentStatus, AdminTone> = {
  PENDING: "warning",
  SUCCEEDED: "success",
  FAILED: "danger",
  REFUNDED: "neutral",
  PARTIALLY_REFUNDED: "violet",
};

export const reportStatusTone: Record<ReportStatus, AdminTone> = {
  OPEN: "warning",
  IN_PROGRESS: "primary",
  RESOLVED: "success",
};

export const inquiryStatusTone: Record<InquiryStatus, AdminTone> = {
  OPEN: "warning",
  IN_PROGRESS: "primary",
  RESOLVED: "success",
};

export const giftTicketTone: Record<GiftTicketStatus, AdminTone> = {
  ACTIVE: "success",
  USED: "neutral",
  EXPIRED: "neutral",
};
