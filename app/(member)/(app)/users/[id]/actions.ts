"use server";

import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ReportType } from "@prisma/client";

/** デート申込み：DateApplication(PENDING) を作成し相手に通知。 */
export async function applyToUser(formData: FormData) {
  const me = await requireMember();
  const targetId = String(formData.get("targetId"));
  const message = String(formData.get("message") ?? "").trim();

  await prisma.dateApplication.create({
    data: {
      applicantId: me.id,
      receiverId: targetId,
      status: "PENDING",
      message: message || null,
    },
  });

  await notify({
    memberId: targetId,
    type: "APPLICATION_RECEIVED",
    title: "デートのお申込みが届きました",
    body: `${me.nickname}さんからデートのお申込みが届いています。`,
  });

  revalidatePath("/matches");
  redirect("/matches");
}

/** ブロック：双方に今後非表示。Block を upsert。 */
export async function blockUser(formData: FormData) {
  const me = await requireMember();
  const targetId = String(formData.get("targetId"));

  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: me.id, blockedId: targetId } },
    create: { blockerId: me.id, blockedId: targetId },
    update: {},
  });

  revalidatePath("/users");
  redirect("/users");
}

/** 通報：Report を作成（運営が確認）。 */
export async function reportUser(formData: FormData) {
  const me = await requireMember();
  const targetId = String(formData.get("targetId"));
  const type = String(formData.get("type")) as ReportType;
  const content = String(formData.get("content") ?? "").trim();

  await prisma.report.create({
    data: {
      reporterId: me.id,
      reportedId: targetId,
      type,
      content: content || "（記載なし）",
      status: "OPEN",
    },
  });

  revalidatePath(`/users/${targetId}`);
  redirect("/users");
}
