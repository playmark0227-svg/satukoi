import { prisma } from "@/lib/db";

/** 稼働確認（Cloud Run のヘルスチェック・デプロイ後の確認用）。DB に届くかも確認する。 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, db: "up" });
  } catch {
    return Response.json({ ok: false, db: "down" }, { status: 503 });
  }
}
