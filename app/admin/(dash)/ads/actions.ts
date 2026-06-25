"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { AdType, AdPosition } from "@prisma/client";

const AD_TYPE_VALUES: AdType[] = ["OWN", "SPONSOR"];
const AD_POSITION_VALUES: AdPosition[] = ["TOP_BOTTOM", "MYPAGE"];

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

/** 広告作成。表示位置・タイプ・バナー画像URL・リンク先URLを登録する。 */
export async function createAd(formData: FormData) {
  await requireAdmin();

  const title = str(formData.get("title"));
  const imageUrl = str(formData.get("imageUrl"));
  const linkUrl = str(formData.get("linkUrl"));
  const rawType = str(formData.get("type")) as AdType;
  const rawPosition = str(formData.get("position")) as AdPosition;
  const type = AD_TYPE_VALUES.includes(rawType) ? rawType : "OWN";
  const position = AD_POSITION_VALUES.includes(rawPosition)
    ? rawPosition
    : "TOP_BOTTOM";
  const isEnabled = formData.get("isEnabled") === "on";
  if (!title || !imageUrl || !linkUrl) return;

  await prisma.ad.create({
    data: {
      title,
      imageUrl,
      linkUrl,
      type,
      position,
      isEnabled,
    },
  });

  revalidatePath("/admin/ads");
}

/** 表示ON/OFFのトグル。 */
export async function toggleAd(formData: FormData) {
  await requireAdmin();

  const id = str(formData.get("id"));
  if (!id) return;

  const current = await prisma.ad.findUnique({
    where: { id },
    select: { isEnabled: true },
  });
  if (!current) return;

  await prisma.ad.update({
    where: { id },
    data: { isEnabled: !current.isEnabled },
  });

  revalidatePath("/admin/ads");
}
