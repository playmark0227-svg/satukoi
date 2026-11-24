// ════════════════════════════════════════════════════════════════════
//  ステータス表示（運営管理画面専用。会員アプリの Badge / StatusBadge は変更しない）
//    StatusPill … 状態（色付き・点つき）
//    Tag        … 種類・対象・位置などの分類（枠線のみ。状態と見分けがつくように塗らない）
//    CountPill  … 件数（1件以上は対応待ちの色）
// ════════════════════════════════════════════════════════════════════

import { cn } from "@/lib/cn";
import {
  TONE_PILL,
  type AdminTone,
  memberStatusTone,
  matchPhaseTone,
  docCheckTone,
  paymentStatusTone,
  reportStatusTone,
  inquiryStatusTone,
  giftTicketTone,
} from "@/lib/admin/tones";
import {
  MEMBER_STATUS_LABELS,
  MATCH_PHASE_LABELS,
  DOCUMENT_CHECK_LABELS,
  PAYMENT_STATUS_LABELS,
  REPORT_STATUS_LABELS,
  INQUIRY_STATUS_LABELS,
  GIFT_TICKET_STATUS_LABELS,
} from "@/lib/constants";
import type {
  DocumentCheckStatus,
  GiftTicketStatus,
  InquiryStatus,
  MatchPhase,
  MemberStatus,
  PaymentStatus,
  ReportStatus,
} from "@prisma/client";

export function StatusPill({
  tone,
  size = "sm",
  dot = true,
  className,
  children,
}: {
  tone: AdminTone;
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap",
        size === "md" ? "px-2.5 py-1 text-[13px]" : "px-2 py-0.5 text-xs",
        TONE_PILL[tone],
        className
      )}
    >
      {dot && <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** 分類ラベル（種類・対象・位置）。状態ではないので塗らない */
export function Tag({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-line bg-surface px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-ink-soft",
        className
      )}
    >
      {children}
    </span>
  );
}

/** 件数（0 は灰色、1件以上は対応待ちの色） */
export function CountPill({ n, className }: { n: number; className?: string }) {
  return (
    <span
      className={cn(
        "num-tnum inline-flex min-w-6 items-center justify-center rounded-full px-1.5 text-xs leading-5 font-bold",
        n > 0 ? "bg-warning-soft text-warning-strong" : "bg-surface-alt text-ink-soft",
        className
      )}
    >
      {n.toLocaleString("ja-JP")}
    </span>
  );
}

type Size = { size?: "sm" | "md" };

export function MemberStatusPill({ status, size }: { status: MemberStatus } & Size) {
  return <StatusPill tone={memberStatusTone[status]} size={size}>{MEMBER_STATUS_LABELS[status]}</StatusPill>;
}

export function MatchPhasePill({ phase, size }: { phase: MatchPhase } & Size) {
  return <StatusPill tone={matchPhaseTone[phase]} size={size}>{MATCH_PHASE_LABELS[phase]}</StatusPill>;
}

export function DocCheckPill({ status, size }: { status: DocumentCheckStatus } & Size) {
  return <StatusPill tone={docCheckTone[status]} size={size}>{DOCUMENT_CHECK_LABELS[status]}</StatusPill>;
}

export function PaymentStatusPill({ status, size }: { status: PaymentStatus } & Size) {
  return <StatusPill tone={paymentStatusTone[status]} size={size}>{PAYMENT_STATUS_LABELS[status]}</StatusPill>;
}

export function ReportStatusPill({ status, size }: { status: ReportStatus } & Size) {
  return <StatusPill tone={reportStatusTone[status]} size={size}>{REPORT_STATUS_LABELS[status]}</StatusPill>;
}

export function InquiryStatusPill({ status, size }: { status: InquiryStatus } & Size) {
  return <StatusPill tone={inquiryStatusTone[status]} size={size}>{INQUIRY_STATUS_LABELS[status]}</StatusPill>;
}

export function GiftTicketStatusPill({ status, size }: { status: GiftTicketStatus } & Size) {
  return <StatusPill tone={giftTicketTone[status]} size={size}>{GIFT_TICKET_STATUS_LABELS[status]}</StatusPill>;
}
