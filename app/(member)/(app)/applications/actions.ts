"use server";

import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/** 自分宛て・お返事待ちのお申込みだけを操作対象にする */
async function loadPendingForMe(applicationId: string, meId: string) {
  const app = await prisma.dateApplication.findUnique({
    where: { id: applicationId },
    include: { applicant: { select: { id: true } } },
  });
  if (!app || app.receiverId !== meId || app.status !== "PENDING") {
    redirect("/applications");
  }
  return app;
}

/**
 * お申込みを承諾：マッチ成立（日程調整中）を作成し、申込者へ MATCHED 通知。
 * 以降は申受側（自分）が日程候補を提示する流れ。
 */
export async function acceptApplication(formData: FormData) {
  const me = await requireMember();
  const app = await loadPendingForMe(String(formData.get("applicationId")), me.id);
  const now = new Date();

  const match = await prisma.$transaction(async (tx) => {
    await tx.dateApplication.update({
      where: { id: app.id },
      data: { status: "ACCEPTED", respondedAt: now },
    });
    return tx.match.create({
      data: {
        applicantId: app.applicantId,
        receiverId: me.id,
        applicationId: app.id,
        phase: "SCHEDULING",
        matchedAt: now,
        lastActionAt: now,
      },
    });
  });

  await notify({
    memberId: app.applicantId,
    type: "MATCHED",
    title: "マッチングが成立しました",
    body: `${me.nickname}さんがお申込みを承諾しました。日程候補が届くまでお待ちください。`,
    matchId: match.id,
  });

  revalidatePath("/applications");
  revalidatePath("/matches");
  redirect(`/matches/${match.id}`);
}

/** お申込みを見送る（申込者への通知は行わない） */
export async function declineApplication(formData: FormData) {
  const me = await requireMember();
  const app = await loadPendingForMe(String(formData.get("applicationId")), me.id);

  await prisma.dateApplication.update({
    where: { id: app.id },
    data: { status: "DECLINED", respondedAt: new Date() },
  });

  revalidatePath("/applications");
  redirect("/applications");
}
