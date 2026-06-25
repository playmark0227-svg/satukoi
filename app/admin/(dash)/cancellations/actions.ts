"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import { WARNING_RULES } from "@/lib/constants";
import { revalidatePath } from "next/cache";

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function revalidate() {
  revalidatePath("/admin/cancellations");
}

/** ペナルティ付与：会員へ警告点（Warning）を作成する。1年以内に3点以上で強制退会の対象。 */
export async function addWarning(formData: FormData) {
  const admin = await requireAdmin();

  const memberId = str(formData.get("memberId"));
  const cancellationId = str(formData.get("cancellationId"));
  const points = Number.parseInt(str(formData.get("points")), 10);
  const reason = str(formData.get("reason")) || "キャンセルによる警告点付与";
  if (!memberId || (points !== 1 && points !== 2)) return;

  const issuedAt = new Date();
  const expiresAt = new Date(
    issuedAt.getTime() + WARNING_RULES.VALID_DAYS * 86_400_000
  );

  await prisma.warning.create({
    data: {
      memberId,
      points,
      reason,
      cancellationId: cancellationId || null,
      issuedAt,
      expiresAt,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorType: "ADMIN",
      actorId: admin.id,
      action: "PENALTY_ISSUED",
      targetType: "Member",
      targetId: memberId,
      detail: { points, reason, cancellationId: cancellationId || null },
    },
  });

  await notify({
    memberId,
    type: "ADMIN_ANNOUNCEMENT",
    title: "警告点が付与されました",
    body: `${reason}（警告${points}点）。1年以内に合計3点以上で強制退会となります。`,
  });

  revalidate();
}

/** 利用停止：会員ステータスを SUSPENDED に変更する（違約金未払い・通報対応など）。 */
export async function suspend(formData: FormData) {
  const admin = await requireAdmin();

  const memberId = str(formData.get("memberId"));
  if (!memberId) return;

  await prisma.member.update({
    where: { id: memberId },
    data: { status: "SUSPENDED", suspendedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      actorType: "ADMIN",
      actorId: admin.id,
      action: "MEMBER_SUSPENDED",
      targetType: "Member",
      targetId: memberId,
    },
  });

  revalidate();
}

/** 強制退会：会員ステータスを WITHDRAWN に変更する（1年以内に警告3点以上など）。 */
export async function forceWithdraw(formData: FormData) {
  const admin = await requireAdmin();

  const memberId = str(formData.get("memberId"));
  if (!memberId) return;

  await prisma.member.update({
    where: { id: memberId },
    data: { status: "WITHDRAWN", withdrawnAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      actorType: "ADMIN",
      actorId: admin.id,
      action: "MEMBER_FORCE_WITHDRAWN",
      targetType: "Member",
      targetId: memberId,
    },
  });

  revalidate();
}
