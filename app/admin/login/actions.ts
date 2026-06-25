"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createAdminSession } from "@/lib/auth";

export async function adminLogin(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) redirect("/admin/login?error=1");

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) redirect("/admin/login?error=1");

  const ok = await verifyPassword(password, admin.passwordHash);
  if (!ok) redirect("/admin/login?error=1");

  await createAdminSession(admin.id);
  redirect("/admin");
}
