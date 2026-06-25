"use server";

import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import { charge, refund } from "@/lib/stripe";
import {
  classifyCancellation,
  resolveCancellationOutcome,
  isDateFeeWaived,
  hasEnoughCandidates,
} from "@/lib/scheduling";
import { PRICING, WARNING_RULES, SERVICE_NAME, dateNotesTemplate } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/** 自分がマッチの当事者かを確認し、相手IDを返す。違えば /matches へ。 */
async function loadMatchForMe(matchId: string, myId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) redirect("/matches");
  if (match.applicantId !== myId && match.receiverId !== myId) {
    redirect("/matches");
  }
  const counterpartId =
    match.applicantId === myId ? match.receiverId : match.applicantId;
  return { match, counterpartId };
}

/**
 * 日程候補の提示。
 * round = 既存提示数 + 1 の ScheduleProposal を作成し、候補を複数ぶら下げる。
 * match.lastActionAt を更新し、相手へ CANDIDATE_RECEIVED 通知。
 */
export async function proposeCandidates(formData: FormData) {
  const me = await requireMember();
  const matchId = String(formData.get("matchId"));
  const { counterpartId } = await loadMatchForMe(matchId, me.id);

  // フォームの rowKey ごとに日付＋開始/終了時刻を取り出す
  const rowKeys = formData.getAll("rowKey").map((v) => String(v));
  const candidates: { startAt: Date; endAt: Date }[] = [];
  for (const key of rowKeys) {
    const date = String(formData.get(`date_${key}`) ?? "");
    const start = String(formData.get(`start_${key}`) ?? "");
    const end = String(formData.get(`end_${key}`) ?? "");
    if (!date || !start || !end) continue;
    const startAt = new Date(`${date}T${start}`);
    const endAt = new Date(`${date}T${end}`);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) continue;
    candidates.push({ startAt, endAt });
  }

  if (!hasEnoughCandidates(candidates.length)) {
    // 件数不足は提示せずに戻す（クライアント側でも防いでいる）
    redirect(`/matches/${matchId}`);
  }

  const existing = await prisma.scheduleProposal.count({ where: { matchId } });

  await prisma.scheduleProposal.create({
    data: {
      matchId,
      proposedById: me.id,
      round: existing + 1,
      candidates: { create: candidates },
    },
  });

  await prisma.match.update({
    where: { id: matchId },
    data: { lastActionAt: new Date() },
  });

  await notify({
    memberId: counterpartId,
    type: "CANDIDATE_RECEIVED",
    title: "デート日程候補が届きました",
    body: `${me.nickname}さんから日程候補が${candidates.length}件届いています。`,
    matchId,
  });

  revalidatePath(`/matches/${matchId}`);
  redirect(`/matches/${matchId}`);
}

/**
 * 候補の選択（日程確定）。
 * 対象候補を isSelected=true にし、DateEvent を作成。
 * 自分のデート代を無料判定して charge → Payment(DATE_FEE) を記録。
 * match.phase=CONFIRMED にし、両者へ DATE_CONFIRMED 通知。
 */
export async function selectCandidate(formData: FormData) {
  const me = await requireMember();
  const matchId = String(formData.get("matchId"));
  const candidateId = String(formData.get("candidateId"));
  const { counterpartId } = await loadMatchForMe(matchId, me.id);

  const candidate = await prisma.scheduleCandidate.findUnique({
    where: { id: candidateId },
    include: { proposal: true },
  });
  if (!candidate || candidate.proposal.matchId !== matchId) {
    redirect(`/matches/${matchId}`);
  }

  await prisma.scheduleCandidate.update({
    where: { id: candidateId },
    data: {
      isSelected: true,
      selectedById: me.id,
      selectedAt: new Date(),
    },
  });

  await prisma.dateEvent.create({
    data: {
      matchId,
      startAt: candidate.startAt,
      endAt: candidate.endAt,
      status: "SCHEDULED",
      notesTemplate: dateNotesTemplate(SERVICE_NAME),
    },
  });

  // 自分のデート代（無料判定）
  const fee = isDateFeeWaived(me);
  if (fee.waived) {
    await prisma.payment.create({
      data: {
        memberId: me.id,
        matchId,
        purpose: "DATE_FEE",
        amount: 0,
        status: "SUCCEEDED",
        waivedReason: fee.reason,
      },
    });
    if (me.referralBonusRemaining > 0 && me.accountType !== "SALON") {
      // 紹介特典を1回消費
      await prisma.member.update({
        where: { id: me.id },
        data: { referralBonusRemaining: { decrement: 1 } },
      });
    }
  } else {
    const result = await charge({
      customerId: me.stripeCustomerId,
      amountYen: PRICING.DATE_FEE,
      description: "デート代",
    });
    await prisma.payment.create({
      data: {
        memberId: me.id,
        matchId,
        purpose: "DATE_FEE",
        amount: PRICING.DATE_FEE,
        status: result.ok ? "SUCCEEDED" : "FAILED",
        stripePaymentIntentId: result.paymentIntentId,
      },
    });
  }

  await prisma.match.update({
    where: { id: matchId },
    data: { phase: "CONFIRMED", lastActionAt: new Date() },
  });

  for (const id of [me.id, counterpartId]) {
    await notify({
      memberId: id,
      type: "DATE_CONFIRMED",
      title: "デート日程が確定しました",
      body: "店舗情報をアプリでご確認ください。",
      matchId,
    });
  }

  revalidatePath(`/matches/${matchId}`);
  redirect(`/matches/${matchId}`);
}

/**
 * 日程変更希望。
 * 開始24時間前までのみ可。phase を SCHEDULING に戻し、
 * DateEvent.status=RESCHEDULING、相手へ RESCHEDULE_REQUEST 通知。
 */
export async function requestReschedule(formData: FormData) {
  const me = await requireMember();
  const matchId = String(formData.get("matchId"));
  const { counterpartId } = await loadMatchForMe(matchId, me.id);

  const event = await prisma.dateEvent.findUnique({ where: { matchId } });
  if (!event) redirect(`/matches/${matchId}`);

  // 24時間前まで（BEFORE_24H のみ許可）
  const category = classifyCancellation(event.startAt);
  if (category !== "BEFORE_24H") {
    redirect(`/matches/${matchId}`);
  }

  await prisma.dateEvent.update({
    where: { matchId },
    data: { status: "RESCHEDULING" },
  });
  await prisma.match.update({
    where: { id: matchId },
    data: { phase: "SCHEDULING", lastActionAt: new Date() },
  });

  await notify({
    memberId: counterpartId,
    type: "RESCHEDULE_REQUEST",
    title: "日程変更のご希望が届きました",
    body: `${me.nickname}さんが日程変更を希望しています。改めて候補をご確認ください。`,
    matchId,
  });

  revalidatePath(`/matches/${matchId}`);
  redirect(`/matches/${matchId}`);
}

/**
 * デートキャンセル（同意必須）。
 * DateEvent.startAt から区分判定 → 返金・違約金・警告を確定。
 * Cancellation 記録 / 相手 Payment 全額返金 / 違約金あれば charge→Payment /
 * 警告点>0なら Warning(1年後失効) / phase=CANCELLED / 両者へ DATE_CANCELLED 通知。
 */
export async function cancelDate(formData: FormData) {
  const me = await requireMember();
  const matchId = String(formData.get("matchId"));
  const agree = formData.get("agree");
  const reason = String(formData.get("reason") ?? "").trim();
  const { counterpartId } = await loadMatchForMe(matchId, me.id);

  if (!agree) {
    // 同意なしはキャンセル不可
    redirect(`/matches/${matchId}`);
  }

  const event = await prisma.dateEvent.findUnique({ where: { matchId } });
  if (!event) redirect(`/matches/${matchId}`);

  const category = classifyCancellation(event.startAt);
  const outcome = resolveCancellationOutcome(category);

  await prisma.cancellation.create({
    data: {
      matchId,
      byMemberId: me.id,
      category,
      reason: reason || "（理由の記載なし）",
      refundIssuedToCounterpart: outcome.refundToCounterpart,
      penaltyAmount: outcome.penaltyAmount,
      warningPoints: outcome.warningPoints,
      freeDateGrantedToCounterpart: outcome.freeDateToCounterpart,
      mutualHide: outcome.mutualHide,
    },
  });

  // 相手側のデート代を全額返金
  if (outcome.refundToCounterpart) {
    const counterpartPayment = await prisma.payment.findFirst({
      where: {
        matchId,
        memberId: counterpartId,
        purpose: "DATE_FEE",
        status: "SUCCEEDED",
      },
    });
    if (counterpartPayment) {
      if (counterpartPayment.amount > 0 && counterpartPayment.stripePaymentIntentId) {
        await refund(counterpartPayment.stripePaymentIntentId);
      }
      await prisma.payment.update({
        where: { id: counterpartPayment.id },
        data: {
          status: "REFUNDED",
          refundedAmount: counterpartPayment.amount,
        },
      });
    }
  }

  // 相手へ次回デート1回無料を付与
  if (outcome.freeDateToCounterpart) {
    await prisma.member.update({
      where: { id: counterpartId },
      data: { referralBonusRemaining: { increment: 1 } },
    });
  }

  // キャンセル者の違約金を即時決済
  if (outcome.penaltyAmount > 0) {
    const result = await charge({
      customerId: me.stripeCustomerId,
      amountYen: outcome.penaltyAmount,
      description: "デートキャンセル違約金",
    });
    await prisma.payment.create({
      data: {
        memberId: me.id,
        matchId,
        purpose:
          outcome.penaltyAmount >= PRICING.PENALTY_NOSHOW
            ? "PENALTY_11000"
            : "PENALTY_5500",
        amount: outcome.penaltyAmount,
        status: result.ok ? "SUCCEEDED" : "FAILED",
        stripePaymentIntentId: result.paymentIntentId,
      },
    });
  }

  // 警告点の付与（付与日から1年間有効）
  if (outcome.warningPoints > 0) {
    const cancellation = await prisma.cancellation.findFirst({
      where: { matchId, byMemberId: me.id },
      orderBy: { createdAt: "desc" },
    });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + WARNING_RULES.VALID_DAYS);
    await prisma.warning.create({
      data: {
        memberId: me.id,
        points: outcome.warningPoints,
        reason: "デートのキャンセル",
        cancellationId: cancellation?.id,
        expiresAt,
      },
    });
  }

  // 相互非表示（③のみ）
  if (outcome.mutualHide) {
    await prisma.block.upsert({
      where: {
        blockerId_blockedId: { blockerId: me.id, blockedId: counterpartId },
      },
      create: { blockerId: me.id, blockedId: counterpartId },
      update: {},
    });
    await prisma.block.upsert({
      where: {
        blockerId_blockedId: { blockerId: counterpartId, blockedId: me.id },
      },
      create: { blockerId: counterpartId, blockedId: me.id },
      update: {},
    });
  }

  await prisma.dateEvent.update({
    where: { matchId },
    data: { status: "CANCELLED" },
  });
  await prisma.match.update({
    where: { id: matchId },
    data: { phase: "CANCELLED", lastActionAt: new Date(), closedAt: new Date() },
  });

  for (const id of [me.id, counterpartId]) {
    await notify({
      memberId: id,
      type: "DATE_CANCELLED",
      title: "デートがキャンセルされました",
      body: "詳細はやりとり画面をご確認ください。",
      matchId,
    });
  }

  revalidatePath(`/matches/${matchId}`);
  redirect("/matches");
}

/**
 * 当日連絡。相手へ DAY_OF_CONTACT 通知し、運営向けに AuditLog を残す。
 */
export async function dayOfContact(formData: FormData) {
  const me = await requireMember();
  const matchId = String(formData.get("matchId"));
  const message = String(formData.get("message") ?? "").trim();
  const { counterpartId } = await loadMatchForMe(matchId, me.id);

  await notify({
    memberId: counterpartId,
    type: "DAY_OF_CONTACT",
    title: "当日のご連絡が届きました",
    body: message || `${me.nickname}さんから当日のご連絡が届いています。`,
    matchId,
  });

  await prisma.auditLog.create({
    data: {
      actorType: "MEMBER",
      actorId: me.id,
      action: "DAY_OF_CONTACT",
      targetType: "Match",
      targetId: matchId,
      detail: { message: message || "" },
    },
  });

  revalidatePath(`/matches/${matchId}`);
  redirect(`/matches/${matchId}`);
}
