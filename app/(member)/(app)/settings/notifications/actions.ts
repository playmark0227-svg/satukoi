"use server";

import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/auth";
import { NOTIFICATION_EVENTS } from "@/lib/notification-rules";
import { revalidatePath } from "next/cache";

/** LINE 通知の受け取り設定（全体の ON/OFF と、イベント別の ON/OFF）を保存 */
export async function saveLineSettings(formData: FormData) {
  const me = await requireMember();
  const notifyViaLine = formData.get("notifyViaLine") === "on";
  const lineMutedTypes = NOTIFICATION_EVENTS.filter(
    (e) => e.memberToggle && formData.get(`line_${e.type}`) !== "on"
  ).map((e) => e.type);

  await prisma.member.update({
    where: { id: me.id },
    data: { notifyViaLine, lineMutedTypes },
  });
  revalidatePath("/settings/notifications");
}
