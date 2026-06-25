"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export async function requestReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (email) {
    const member = await prisma.member.findUnique({ where: { email } });
    if (member) {
      // 生のトークン（メールのリンク用）とそのハッシュ（DB保管用）
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = await hashPassword(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1時間後

      await prisma.passwordResetToken.create({
        data: {
          memberId: member.id,
          tokenHash,
          expiresAt,
        },
      });

      // メール送信はスタブ。実装時はここで再設定リンクを送信する。
      console.info(
        `[password-reset] ${email} -> /reset-password?token=${rawToken}`
      );
    }
  }

  // 会員の存在有無を漏らさないため、常に成功表示へ。
  redirect("/forgot-password?sent=1");
}
