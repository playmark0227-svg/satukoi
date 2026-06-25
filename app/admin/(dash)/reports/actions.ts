"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function revalidate() {
  revalidatePath("/admin/reports");
}

/** 通報の対応完了：status=RESOLVED、handledAt を記録する。 */
export async function resolveReport(formData: FormData) {
  const admin = await requireAdmin();

  const reportId = str(formData.get("reportId"));
  if (!reportId) return;

  await prisma.report.update({
    where: { id: reportId },
    data: { status: "RESOLVED", handledAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      actorType: "ADMIN",
      actorId: admin.id,
      action: "REPORT_RESOLVED",
      targetType: "Report",
      targetId: reportId,
    },
  });

  revalidate();
}

/** 通報対象会員の利用停止：status を SUSPENDED に変更する。 */
export async function suspendReported(formData: FormData) {
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

/** 通報に関する運営メモを対象会員へ追加する。 */
export async function addReportMemo(formData: FormData) {
  const admin = await requireAdmin();

  const memberId = str(formData.get("memberId"));
  const body = str(formData.get("body"));
  if (!memberId || !body) return;

  await prisma.adminMemo.create({
    data: { memberId, authorId: admin.id, body },
  });

  revalidate();
}

/** お問い合わせの対応完了：status=RESOLVED、handledAt を記録する。 */
export async function resolveInquiry(formData: FormData) {
  const admin = await requireAdmin();

  const inquiryId = str(formData.get("inquiryId"));
  if (!inquiryId) return;

  await prisma.inquiry.update({
    where: { id: inquiryId },
    data: { status: "RESOLVED", handledAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      actorType: "ADMIN",
      actorId: admin.id,
      action: "INQUIRY_RESOLVED",
      targetType: "Inquiry",
      targetId: inquiryId,
    },
  });

  revalidate();
}
