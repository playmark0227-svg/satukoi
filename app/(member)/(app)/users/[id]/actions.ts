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

  // 二重申込みの防止：マッチ中ならその画面へ、どちらかの申込みがお返事待ちならお申込み一覧へ
  const pair = [
    { applicantId: me.id, receiverId: targetId },
    { applicantId: targetId, receiverId: me.id },
  ];
  const active = await prisma.match.findFirst({
    where: { phase: { in: ["SCHEDULING", "CONFIRMED"] }, OR: pair },
    select: { id: true },
  });
  if (active) redirect(`/matches/${active.id}`);
  const pending = await prisma.dateApplication.findFirst({
    where: { status: "PENDING", OR: pair },
    select: { id: true },
  });
  if (pending) redirect("/applications");

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

  revalidatePath("/applications");
  redirect("/applications?tab=sent");
}

/**
 * いいね：Like を作成し、相手に LIKE_RECEIVED を通知（LINE 通知の対象）。
 * いいねは取り消せない一方向のアプローチ（何度押しても通知は1回だけ）。
 */
export async function likeUser(targetId: string): Promise<{ ok: boolean }> {
  const me = await requireMember();
  if (targetId === me.id) return { ok: false };

  const target = await prisma.member.findUnique({
    where: { id: targetId },
    select: { id: true, sex: true, status: true },
  });
  if (!target || target.status !== "ACTIVE" || target.sex === me.sex) return { ok: false };

  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: me.id, blockedId: targetId },
        { blockerId: targetId, blockedId: me.id },
      ],
    },
    select: { id: true },
  });
  if (blocked) return { ok: false };

  const existing = await prisma.like.findUnique({
    where: { fromId_toId: { fromId: me.id, toId: targetId } },
    select: { id: true },
  });
  if (existing) return { ok: true };

  await prisma.like.create({ data: { fromId: me.id, toId: targetId } });

  const mutual = await prisma.like.findUnique({
    where: { fromId_toId: { fromId: targetId, toId: me.id } },
    select: { id: true },
  });
  await notify({
    memberId: targetId,
    type: "LIKE_RECEIVED",
    title: mutual ? "お互いにいいね！になりました" : "いいねが届きました",
    body: mutual
      ? `${me.nickname}さんもあなたにいいね！しています。デートを申し込んでみましょう。`
      : `${me.nickname}さんからいいねが届きました。プロフィールを見てみましょう。`,
    path: `/users/${me.id}`,
  });

  revalidatePath(`/users/${targetId}`);
  revalidatePath("/users");
  return { ok: true };
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
