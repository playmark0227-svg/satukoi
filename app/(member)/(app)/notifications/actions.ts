"use server";

import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/** 自分の未読通知をすべて既読にする。 */
export async function markAllRead() {
  const me = await requireMember();
  await prisma.notification.updateMany({
    where: { memberId: me.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
}
