"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { GiftTicketReason } from "@prisma/client";
import { GIFT_TICKET_AMOUNT } from "@/lib/constants";

const REASON_VALUES: GiftTicketReason[] = [
  "REFERRAL",
  "CAMPAIGN",
  "COMPENSATION",
];

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function optStr(v: FormDataEntryValue | null): string | null {
  const s = str(v);
  return s === "" ? null : s;
}

/** 店頭提示用コード（SATSU-GIFT-XXXXXX）。紛らわしい 0/O/1/I は除外。 */
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SATSU-GIFT-${suffix}`;
}

/** ギフト券を発行する（運営操作）。 */
export async function issueGiftTicket(formData: FormData) {
  await requireAdmin();

  const memberId = str(formData.get("memberId"));
  if (!memberId) return;

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { id: true },
  });
  if (!member) return;

  const rawAmount = Number(str(formData.get("amount")));
  const amount =
    Number.isInteger(rawAmount) && rawAmount > 0 ? rawAmount : GIFT_TICKET_AMOUNT;

  const rawReason = str(formData.get("reason")) as GiftTicketReason;
  const reason = REASON_VALUES.includes(rawReason) ? rawReason : "CAMPAIGN";

  // 有効期限：発行日から nヶ月（0 または未指定は無期限）
  const months = Number(str(formData.get("expiresInMonths")));
  let expiresAt: Date | null = null;
  if (Number.isInteger(months) && months > 0) {
    expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);
  }

  // code は @unique。衝突時は再生成（最大5回試行）。
  let code = generateCode();
  for (let i = 0; i < 5; i++) {
    const dup = await prisma.giftTicket.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!dup) break;
    code = generateCode();
  }

  await prisma.giftTicket.create({
    data: {
      memberId,
      code,
      amount,
      reason,
      note: optStr(formData.get("note")),
      expiresAt,
    },
  });

  revalidatePath("/admin/gift-tickets");
}

/** 店頭利用の報告を受けて使用済みにする（運営操作）。 */
export async function markUsed(formData: FormData) {
  await requireAdmin();

  const id = str(formData.get("id"));
  if (!id) return;

  const ticket = await prisma.giftTicket.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!ticket || ticket.status !== "ACTIVE") return;

  await prisma.giftTicket.update({
    where: { id },
    data: { status: "USED", usedAt: new Date() },
  });

  revalidatePath("/admin/gift-tickets");
}
