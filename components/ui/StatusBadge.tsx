import { Badge, type Tone } from "@/components/ui/Badge";
import {
  MEMBER_STATUS_LABELS,
  MATCH_PHASE_LABELS,
  DOCUMENT_CHECK_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/constants";

type MemberStatus = keyof typeof MEMBER_STATUS_LABELS;
type MatchPhase = keyof typeof MATCH_PHASE_LABELS;
type DocCheck = keyof typeof DOCUMENT_CHECK_LABELS;
type PayStatus = keyof typeof PAYMENT_STATUS_LABELS;

const memberTone: Record<MemberStatus, Tone> = {
  DOCUMENT_REVIEW: "warning",
  ACTIVE: "success",
  SUSPENDED: "danger",
  WITHDRAWN: "neutral",
};

const phaseTone: Record<MatchPhase, Tone> = {
  SCHEDULING: "info",
  CONFIRMED: "primary",
  COMPLETED: "success",
  CANCELLED: "neutral",
};

const docTone: Record<DocCheck, Tone> = {
  PENDING: "warning",
  OK: "success",
  NG: "danger",
};

const payTone: Record<PayStatus, Tone> = {
  PENDING: "warning",
  SUCCEEDED: "success",
  FAILED: "danger",
  REFUNDED: "neutral",
  PARTIALLY_REFUNDED: "info",
};

export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  return <Badge tone={memberTone[status]}>{MEMBER_STATUS_LABELS[status]}</Badge>;
}

/** 運営向け：4フェーズ表示 */
export function MatchPhaseBadge({ phase }: { phase: MatchPhase }) {
  return <Badge tone={phaseTone[phase]}>{MATCH_PHASE_LABELS[phase]}</Badge>;
}

/** 会員向け：日程調整中 / 日程確定 の2種類のみ */
export function MemberFacingPhaseBadge({ phase }: { phase: MatchPhase }) {
  const confirmed = phase === "CONFIRMED";
  return (
    <Badge tone={confirmed ? "primary" : "info"}>
      {confirmed ? "日程確定" : "日程調整中"}
    </Badge>
  );
}

export function DocCheckBadge({ status }: { status: DocCheck }) {
  return <Badge tone={docTone[status]}>{DOCUMENT_CHECK_LABELS[status]}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PayStatus }) {
  return <Badge tone={payTone[status]}>{PAYMENT_STATUS_LABELS[status]}</Badge>;
}
