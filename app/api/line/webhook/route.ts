import { prisma } from "@/lib/db";
import { appUrl, replyLineMessage, verifyLineSignature } from "@/lib/line";

/**
 * LINE 公式アカウント（Messaging API）の Webhook。
 * LINE Developers の Webhook URL に https://<ドメイン>/api/line/webhook を設定する。
 *  - follow   … 友だち追加（ブロック解除）→ lineFollowing=true、あいさつを返信
 *  - unfollow … ブロック → lineFollowing=false（以降 LINE 通知は送らない）
 *  - message  … 公式アカウントへのメッセージ → アプリへの案内を返信（チャットは行わない）
 */

type LineEvent = {
  type: string;
  replyToken?: string;
  source?: { type: string; userId?: string };
};

const text = (t: string) => ({ type: "text", text: t });

export async function POST(request: Request) {
  const raw = await request.text();
  if (!(await verifyLineSignature(raw, request.headers.get("x-line-signature")))) {
    return new Response("invalid signature", { status: 401 });
  }

  const { events = [] } = JSON.parse(raw) as { events?: LineEvent[] };

  for (const ev of events) {
    const userId = ev.source?.type === "user" ? ev.source.userId : undefined;
    if (!userId) continue;

    try {
      if (ev.type === "follow" || ev.type === "unfollow") {
        await prisma.member.updateMany({
          where: { lineUserId: userId },
          data: { lineFollowing: ev.type === "follow" },
        });
      }

      if (!ev.replyToken) continue;
      if (ev.type === "follow") {
        const member = await prisma.member.findUnique({
          where: { lineUserId: userId },
          select: { nickname: true },
        });
        await replyLineMessage(ev.replyToken, [
          text(
            member
              ? `${member.nickname}さん、友だち追加ありがとうございます！\nいいね・デートのお申込み・マッチング成立などをこのLINEでお知らせします。`
              : "友だち追加ありがとうございます！\nサツコイ！は「チャットなし、ちゃんと会える」札幌の恋活サービスです。下のリンクからLINEでかんたんに登録・ログインできます。"
          ),
          text(appUrl(member ? "/users" : "/login")),
        ]);
      } else if (ev.type === "message") {
        await replyLineMessage(ev.replyToken, [
          text("このアカウントは通知専用です。お問い合わせ・各種操作はアプリからお願いします。"),
          text(appUrl("/contact")),
        ]);
      }
    } catch (e) {
      console.error("[LINE webhook] event failed", ev.type, e);
    }
  }

  // LINE には常に 200 を返す（再送を防ぐ）
  return Response.json({ ok: true });
}
