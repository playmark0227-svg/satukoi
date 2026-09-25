import { prisma } from "@/lib/db";
import { verifyLineIdToken } from "@/lib/line";
import { createMemberSession, getCurrentMemberId, setLinePending } from "@/lib/auth";

/**
 * LIFF からのログイン。
 * body: { idToken } → LINE で検証 → 次の画面（next）を返す。
 *  - 連携済みの会員      … セッション発行してホームへ
 *  - メールでログイン中   … その会員に LINE を紐付け（LINE連携）
 *  - 未登録の LINE ユーザー … LINE情報を一時保存して新規登録へ
 */
export async function POST(request: Request) {
  const { idToken } = (await request.json().catch(() => ({}))) as { idToken?: string };
  const line = await verifyLineIdToken(idToken ?? "");
  if (!line) {
    return Response.json({ error: "LINEの認証に失敗しました" }, { status: 401 });
  }

  const linked = await prisma.member.findUnique({ where: { lineUserId: line.sub } });
  if (linked) {
    if (linked.status === "WITHDRAWN") {
      return Response.json({ error: "退会済みのアカウントです" }, { status: 403 });
    }
    await createMemberSession(linked.id);
    return Response.json({ next: "/users" });
  }

  const currentId = await getCurrentMemberId();
  if (currentId) {
    await prisma.member.update({
      where: { id: currentId },
      data: { lineUserId: line.sub, lineConnected: true },
    });
    return Response.json({ next: null, linked: true });
  }

  await setLinePending(line);
  return Response.json({ next: "/register?via=line" });
}
