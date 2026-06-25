"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import { revalidatePath } from "next/cache";
import type {
  MemberStatus,
  DocumentType,
  DocumentCheckStatus,
} from "@prisma/client";

const MEMBER_STATUS_VALUES: MemberStatus[] = [
  "DOCUMENT_REVIEW",
  "ACTIVE",
  "SUSPENDED",
  "WITHDRAWN",
];
const DOC_TYPE_VALUES: DocumentType[] = [
  "ID_DOCUMENT",
  "SINGLE_CERT",
  "INCOME_CERT",
];
const DOC_CHECK_VALUES: DocumentCheckStatus[] = ["PENDING", "OK", "NG"];

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function revalidate(id: string) {
  revalidatePath(`/admin/members/${id}`);
  revalidatePath("/admin/members");
}

/** 承認：書類確認OK → 有効化（ACTIVE + approvedAt）。承認通知を任意送信。 */
export async function approveMember(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("memberId"));
  if (!id) return;

  await prisma.member.update({
    where: { id },
    data: { status: "ACTIVE", approvedAt: new Date() },
  });

  await notify({
    memberId: id,
    type: "ADMIN_ANNOUNCEMENT",
    title: "ご登録が承認されました",
    body: "審査が完了し、サービスをご利用いただけるようになりました。",
  });

  revalidate(id);
}

/** ステータス変更（select の任意の値へ） */
export async function setStatus(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("memberId"));
  const next = str(formData.get("status")) as MemberStatus;
  if (!id || !MEMBER_STATUS_VALUES.includes(next)) return;

  await prisma.member.update({
    where: { id },
    data: {
      status: next,
      approvedAt: next === "ACTIVE" ? new Date() : undefined,
      suspendedAt: next === "SUSPENDED" ? new Date() : undefined,
      withdrawnAt: next === "WITHDRAWN" ? new Date() : undefined,
    },
  });

  revalidate(id);
}

/** 差戻し（Document NG）：身分証・独身証明など必須書類をまとめて NG にし、書類確認中へ。 */
export async function rejectDocuments(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("memberId"));
  const note = str(formData.get("note"));
  if (!id) return;

  await prisma.document.updateMany({
    where: { memberId: id, type: { in: ["ID_DOCUMENT", "SINGLE_CERT"] } },
    data: {
      checkStatus: "NG",
      checkedAt: new Date(),
      note: note || "書類を再提出してください。",
    },
  });
  await prisma.member.update({
    where: { id },
    data: { status: "DOCUMENT_REVIEW", approvedAt: null },
  });

  await notify({
    memberId: id,
    type: "ADMIN_ANNOUNCEMENT",
    title: "書類の再提出のお願い",
    body: note || "ご提出いただいた書類に不備がありました。再提出をお願いします。",
  });

  revalidate(id);
}

/** 強制退会（WITHDRAWN） */
export async function forceWithdraw(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("memberId"));
  if (!id) return;

  await prisma.member.update({
    where: { id },
    data: { status: "WITHDRAWN", withdrawnAt: new Date() },
  });

  revalidate(id);
}

/** 利用停止（SUSPENDED） */
export async function suspendMember(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("memberId"));
  if (!id) return;

  await prisma.member.update({
    where: { id },
    data: { status: "SUSPENDED", suspendedAt: new Date() },
  });

  revalidate(id);
}

/** 紹介特典（デート代無料）残数の変更 */
export async function setReferralBonus(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("memberId"));
  const raw = str(formData.get("referralBonusRemaining"));
  if (!id) return;

  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n < 0) return;

  await prisma.member.update({
    where: { id },
    data: { referralBonusRemaining: n },
  });

  revalidate(id);
}

/** 運営メモの追加 */
export async function addMemo(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData.get("memberId"));
  const body = str(formData.get("body"));
  if (!id || !body) return;

  await prisma.adminMemo.create({
    data: { memberId: id, authorId: admin.id, body },
  });

  revalidate(id);
}

/** 各書類の OK / NG 設定 */
export async function setDocCheck(formData: FormData) {
  await requireAdmin();
  const id = str(formData.get("memberId"));
  const docType = str(formData.get("docType")) as DocumentType;
  const next = str(formData.get("checkStatus")) as DocumentCheckStatus;
  const note = str(formData.get("note"));
  if (
    !id ||
    !DOC_TYPE_VALUES.includes(docType) ||
    !DOC_CHECK_VALUES.includes(next)
  ) {
    return;
  }

  const doc = await prisma.document.findFirst({
    where: { memberId: id, type: docType },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!doc) return;

  await prisma.document.update({
    where: { id: doc.id },
    data: {
      checkStatus: next,
      checkedAt: new Date(),
      note: next === "NG" ? note || "再提出をお願いします。" : null,
    },
  });

  revalidate(id);
}
