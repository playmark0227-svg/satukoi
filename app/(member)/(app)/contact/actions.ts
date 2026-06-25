"use server";

import { prisma } from "@/lib/db";
import { requireMember } from "@/lib/auth";
import { redirect } from "next/navigation";

/** お問い合わせの送信：Inquiry を作成し ?sent=1 で完了表示。 */
export async function submitInquiry(formData: FormData) {
  const me = await requireMember();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  await prisma.inquiry.create({
    data: {
      memberId: me.id,
      email: me.email,
      subject: subject || "（件名なし）",
      body: body || "（記載なし）",
      status: "OPEN",
    },
  });

  redirect("/contact?sent=1");
}
