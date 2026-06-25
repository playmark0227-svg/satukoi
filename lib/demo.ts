// ════════════════════════════════════════════════════════════════════
//  デモモード（GitHub Pages 静的エクスポート用）
//  DEMO_EXPORT=1 のとき、Cookie を使わず seed データから固定の
//  「デモ会員 / デモ運営」を返すことで、認証必須画面も静的生成できる。
//  ※ 読み取り専用デモ。フォーム送信・ログイン等は動作しない。
// ════════════════════════════════════════════════════════════════════

import { prisma } from "@/lib/db";

export const IS_DEMO = process.env.DEMO_EXPORT === "1";

/** デモ会員：マッチ数が多い ACTIVE 男性会員（決定的に同一を返す）。 */
export async function getDemoMember() {
  const m = await prisma.member.findFirst({
    where: { status: "ACTIVE", sex: "MALE" },
    include: { photos: { orderBy: { order: "asc" } } },
    orderBy: [{ matchesAsApplicant: { _count: "desc" } }, { createdAt: "asc" }],
  });
  if (!m) throw new Error("DEMO: ACTIVE な会員が見つかりません（seed を実行してください）");
  return m;
}

export async function getDemoMemberId() {
  const m = await getDemoMember();
  return m.id;
}

export async function getDemoAdmin() {
  const a = await prisma.adminUser.findFirst({ orderBy: { createdAt: "asc" } });
  if (!a) throw new Error("DEMO: 運営アカウントが見つかりません（seed を実行してください）");
  return a;
}
