"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import { refund } from "@/lib/stripe";
import {
  classifyCancellation,
  resolveCancellationOutcome,
} from "@/lib/scheduling";
import { PRICING } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import type {
  MatchPhase,
  CancellationCategory,
  PaymentPurpose,
} from "@prisma/client";

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

const PHASES: MatchPhase[] = ["SCHEDULING", "CONFIRMED", "COMPLETED", "CANCELLED"];

function revalidateMatch(id: string) {
  revalidatePath(`/admin/matches/${id}`);
  revalidatePath("/admin/matches");
}

/** フェーズ手動変更（運営判断での状態遷移） */
export async function setPhase(formData: FormData) {
  const admin = await requireAdmin();

  const matchId = str(formData.get("matchId"));
  const phase = str(formData.get("phase")) as MatchPhase;
  if (!matchId || !PHASES.includes(phase)) return;

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return;

  await prisma.match.update({
    where: { id: matchId },
    data: {
      phase,
      lastActionAt: new Date(),
      closedAt:
        phase === "COMPLETED" || phase === "CANCELLED" ? new Date() : null,
    },
  });

  // デート実施記録のステータスも追従させる
  if (phase === "COMPLETED") {
    await prisma.dateEvent.updateMany({
      where: { matchId },
      data: { status: "COMPLETED" },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorType: "ADMIN",
      actorId: admin.id,
      action: "MATCH_PHASE_CHANGED",
      targetType: "Match",
      targetId: matchId,
      detail: { from: match.phase, to: phase },
    },
  });

  revalidateMatch(matchId);
}

/** 店舗情報確定（事前登録店舗から選択し、予約名・注意事項テンプレを設定） */
export async function confirmStore(formData: FormData) {
  const admin = await requireAdmin();

  const matchId = str(formData.get("matchId"));
  const storeId = str(formData.get("storeId"));
  const reservationName = str(formData.get("reservationName"));
  const notesTemplate = str(formData.get("notesTemplate"));
  if (!matchId || !storeId) return;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { dateEvent: true },
  });
  if (!match || !match.dateEvent) return;

  await prisma.dateEvent.update({
    where: { matchId },
    data: {
      storeId,
      storeConfirmedAt: new Date(),
      reservationName: reservationName || "サツコイ！",
      notesTemplate: notesTemplate || null,
    },
  });

  await prisma.match.update({
    where: { id: matchId },
    data: { lastActionAt: new Date() },
  });

  // 両会員へ当日連絡（店舗情報確定の通知）
  for (const memberId of [match.applicantId, match.receiverId]) {
    await notify({
      memberId,
      type: "DAY_OF_CONTACT",
      title: "デートの店舗情報が確定しました",
      body: "店舗・集合場所をアプリでご確認ください。",
      matchId,
    });
  }

  await prisma.auditLog.create({
    data: {
      actorType: "ADMIN",
      actorId: admin.id,
      action: "STORE_CONFIRMED",
      targetType: "Match",
      targetId: matchId,
      detail: { storeId },
    },
  });

  revalidateMatch(matchId);
}

/** 返金フラグ：指定の決済を返金処理する（Stripe スタブ経由） */
export async function issueRefund(formData: FormData) {
  const admin = await requireAdmin();

  const matchId = str(formData.get("matchId"));
  const paymentId = str(formData.get("paymentId"));
  if (!matchId || !paymentId) return;

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status !== "SUCCEEDED") return;

  const result = payment.stripePaymentIntentId
    ? await refund(payment.stripePaymentIntentId)
    : { ok: true, stub: true, message: "[STUB] 返金" };

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: result.ok ? "REFUNDED" : payment.status,
      refundedAmount: result.ok ? payment.amount : payment.refundedAmount,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: "ADMIN",
      actorId: admin.id,
      action: "REFUND_ISSUED",
      targetType: "Payment",
      targetId: paymentId,
      detail: { amount: payment.amount, message: result.message },
    },
  });

  revalidateMatch(matchId);
}

/** 違約金フラグ：キャンセル者へ違約金の決済予定を計上する */
export async function flagPenalty(formData: FormData) {
  const admin = await requireAdmin();

  const matchId = str(formData.get("matchId"));
  const memberId = str(formData.get("memberId"));
  const purpose = str(formData.get("purpose")) as PaymentPurpose;
  if (
    !matchId ||
    !memberId ||
    (purpose !== "PENALTY_5500" && purpose !== "PENALTY_11000")
  ) {
    return;
  }

  const amount =
    purpose === "PENALTY_11000" ? PRICING.PENALTY_NOSHOW : PRICING.PENALTY_24H_2H;

  await prisma.payment.create({
    data: {
      memberId,
      matchId,
      purpose,
      amount,
      status: "PENDING",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: "ADMIN",
      actorId: admin.id,
      action: "PENALTY_FLAGGED",
      targetType: "Match",
      targetId: matchId,
      detail: { memberId, purpose, amount },
    },
  });

  revalidateMatch(matchId);
}

/** 運営メモの追加（マッチに紐づく） */
export async function addMemo(formData: FormData) {
  const admin = await requireAdmin();

  const matchId = str(formData.get("matchId"));
  const body = str(formData.get("body"));
  if (!matchId || !body) return;

  await prisma.adminMemo.create({
    data: { matchId, authorId: admin.id, body },
  });

  revalidateMatch(matchId);
}

/** 運営によるデートキャンセル処理（区分に応じた返金・違約金・警告を確定） */
export async function adminCancel(formData: FormData) {
  const admin = await requireAdmin();

  const matchId = str(formData.get("matchId"));
  const byMemberId = str(formData.get("byMemberId"));
  const reason = str(formData.get("reason")) || "運営によるキャンセル処理";
  if (!matchId || !byMemberId) return;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { dateEvent: true },
  });
  if (!match) return;

  // キャンセル者の相手側
  const counterpartId =
    match.applicantId === byMemberId ? match.receiverId : match.applicantId;

  // 区分は確定済みデート開始時刻から判定（未確定なら最も軽い区分）
  const category: CancellationCategory = match.dateEvent
    ? classifyCancellation(match.dateEvent.startAt)
    : "BEFORE_24H";
  const outcome = resolveCancellationOutcome(category);

  await prisma.cancellation.create({
    data: {
      matchId,
      byMemberId,
      category,
      reason,
      refundIssuedToCounterpart: outcome.refundToCounterpart,
      penaltyAmount: outcome.penaltyAmount,
      warningPoints: outcome.warningPoints,
      freeDateGrantedToCounterpart: outcome.freeDateToCounterpart,
      mutualHide: outcome.mutualHide,
    },
  });

  await prisma.match.update({
    where: { id: matchId },
    data: { phase: "CANCELLED", lastActionAt: new Date(), closedAt: new Date() },
  });
  if (match.dateEvent) {
    await prisma.dateEvent.update({
      where: { matchId },
      data: { status: "CANCELLED" },
    });
  }

  // 両会員へキャンセル通知
  for (const memberId of [match.applicantId, match.receiverId]) {
    await notify({
      memberId,
      type: "DATE_CANCELLED",
      title: "デートがキャンセルされました",
      body: "詳細はマイページをご確認ください。",
      matchId,
    });
  }

  await prisma.auditLog.create({
    data: {
      actorType: "ADMIN",
      actorId: admin.id,
      action: "MATCH_CANCELLED",
      targetType: "Match",
      targetId: matchId,
      detail: {
        byMemberId,
        counterpartId,
        category,
        penaltyAmount: outcome.penaltyAmount,
      },
    },
  });

  revalidateMatch(matchId);
}
