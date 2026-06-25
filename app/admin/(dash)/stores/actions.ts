"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const MAX_STORES = 5;

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function optStr(v: FormDataEntryValue | null): string | null {
  const s = str(v);
  return s === "" ? null : s;
}

export async function createStore(formData: FormData) {
  await requireAdmin();

  const name = str(formData.get("name"));
  const address = str(formData.get("address"));
  if (!name || !address) {
    return; // 必須項目が未入力（UI 側 required で抑止）
  }

  // 5店舗の上限（仕様：店舗は5店舗まで事前登録）
  const count = await prisma.store.count();
  if (count >= MAX_STORES) {
    return;
  }

  await prisma.store.create({
    data: {
      name,
      address,
      area: optStr(formData.get("area")),
      phone: optStr(formData.get("phone")),
      notes: optStr(formData.get("notes")),
      isActive: true,
    },
  });

  revalidatePath("/admin/stores");
}

export async function updateStore(formData: FormData) {
  await requireAdmin();

  const id = str(formData.get("id"));
  const name = str(formData.get("name"));
  const address = str(formData.get("address"));
  if (!id || !name || !address) {
    return;
  }

  await prisma.store.update({
    where: { id },
    data: {
      name,
      address,
      area: optStr(formData.get("area")),
      phone: optStr(formData.get("phone")),
      notes: optStr(formData.get("notes")),
      isActive: formData.get("isActive") === "on",
    },
  });

  revalidatePath("/admin/stores");
}

export async function toggleStoreActive(formData: FormData) {
  await requireAdmin();

  const id = str(formData.get("id"));
  if (!id) return;

  const store = await prisma.store.findUnique({
    where: { id },
    select: { isActive: true },
  });
  if (!store) return;

  await prisma.store.update({
    where: { id },
    data: { isActive: !store.isActive },
  });

  revalidatePath("/admin/stores");
}
