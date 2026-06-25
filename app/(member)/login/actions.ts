"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createMemberSession } from "@/lib/auth";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) redirect("/login?error=1");

  const member = await prisma.member.findUnique({ where: { email } });
  if (!member) redirect("/login?error=1");

  const ok = await verifyPassword(password, member.passwordHash);
  if (!ok) redirect("/login?error=1");

  await createMemberSession(member.id);
  redirect("/users");
}
