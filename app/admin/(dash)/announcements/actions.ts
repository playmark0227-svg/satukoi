"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { AnnouncementTarget } from "@prisma/client";

const TARGET_VALUES: AnnouncementTarget[] = ["ALL", "MALE", "FEMALE"];

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

/** お知らせ作成。公開（isPublished=true）の場合は publishedAt=now を記録する。 */
export async function createAnnouncement(formData: FormData) {
  await requireAdmin();

  const title = str(formData.get("title"));
  const body = str(formData.get("body"));
  const rawTarget = str(formData.get("target")) as AnnouncementTarget;
  const target = TARGET_VALUES.includes(rawTarget) ? rawTarget : "ALL";
  const isPublished = formData.get("isPublished") === "on";
  if (!title || !body) return;

  await prisma.announcement.create({
    data: {
      title,
      body,
      target,
      isPublished,
      publishedAt: isPublished ? new Date() : null,
    },
  });

  revalidatePath("/admin/announcements");
}

/** 公開トグル。公開に切り替える際は publishedAt を記録、非公開に戻すと null に。 */
export async function togglePublish(formData: FormData) {
  await requireAdmin();

  const id = str(formData.get("id"));
  if (!id) return;

  const current = await prisma.announcement.findUnique({
    where: { id },
    select: { isPublished: true, publishedAt: true },
  });
  if (!current) return;

  const next = !current.isPublished;

  await prisma.announcement.update({
    where: { id },
    data: {
      isPublished: next,
      // 初回公開時のみ publishedAt を確定。再公開は既存値を保持。
      publishedAt: next ? current.publishedAt ?? new Date() : null,
    },
  });

  revalidatePath("/admin/announcements");
}
