"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { NOTIFICATION_EVENTS } from "@/lib/notification-rules";
import { revalidatePath } from "next/cache";

function optInt(v: FormDataEntryValue | null): number | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (s === "") return null;
  const n = Math.floor(Number(s));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** LINE 配信の全体設定（全体スイッチ・月間上限・優先枠） */
export async function saveLineDelivery(formData: FormData) {
  const admin = await requireAdmin();
  const enabled = formData.get("enabled") === "on";
  const monthlyLimit = optInt(formData.get("monthlyLimit"));
  const reserve = optInt(formData.get("priorityReserve")) ?? 0;
  const priorityReserve = monthlyLimit == null ? reserve : Math.min(reserve, monthlyLimit);

  await prisma.lineDeliverySetting.upsert({
    where: { id: "default" },
    create: { id: "default", enabled, monthlyLimit, priorityReserve },
    update: { enabled, monthlyLimit, priorityReserve },
  });
  await prisma.auditLog.create({
    data: {
      actorType: "ADMIN",
      actorId: admin.id,
      action: "LINE_DELIVERY_UPDATE",
      targetType: "LineDeliverySetting",
      targetId: "default",
      detail: { enabled, monthlyLimit, priorityReserve },
    },
  });
  revalidatePath("/admin/line");
}

/** イベント別の配信ルール（LINE / メール / 優先）をまとめて保存 */
export async function saveNotificationRules(formData: FormData) {
  const admin = await requireAdmin();
  const rules = NOTIFICATION_EVENTS.map((e) => ({
    type: e.type,
    lineEnabled: formData.get(`line_${e.type}`) === "on",
    emailEnabled: formData.get(`email_${e.type}`) === "on",
    priority: formData.get(`priority_${e.type}`) === "on" ? 1 : 0,
  }));

  await prisma.$transaction(
    rules.map((r) =>
      prisma.notificationRule.upsert({ where: { type: r.type }, create: r, update: r })
    )
  );
  await prisma.auditLog.create({
    data: {
      actorType: "ADMIN",
      actorId: admin.id,
      action: "NOTIFICATION_RULES_UPDATE",
      targetType: "NotificationRule",
      targetId: "all",
      detail: rules,
    },
  });
  revalidatePath("/admin/line");
}

/** 既定値に戻す（上書きを削除） */
export async function resetNotificationRules() {
  await requireAdmin();
  await prisma.notificationRule.deleteMany();
  revalidatePath("/admin/line");
}
