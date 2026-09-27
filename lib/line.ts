// ════════════════════════════════════════════════════════════════════
//  LINE（LIFF／LINEログイン）サーバー側ユーティリティ
//  LIFF で取得した ID トークンを LINE の検証エンドポイントで確認し、
//  LINE ユーザーID（sub）・表示名・プロフィール画像を取り出す。
//  必要な環境変数：LINE_LOGIN_CHANNEL_ID（LIFF アプリを作成した LINE ログインチャネルのID）
// ════════════════════════════════════════════════════════════════════

export type LineIdentity = { sub: string; name?: string; picture?: string };

const VERIFY_URL = "https://api.line.me/oauth2/v2.1/verify";

/** ID トークンを検証して LINE ユーザー情報を返す。無効なら null。 */
export async function verifyLineIdToken(idToken: string): Promise<LineIdentity | null> {
  const channelId = process.env.LINE_LOGIN_CHANNEL_ID;
  if (!channelId || !idToken) return null;

  const res = await fetch(VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ id_token: idToken, client_id: channelId }),
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { sub?: string; name?: string; picture?: string; aud?: string };
  if (!data.sub || data.aud !== channelId) return null;
  return { sub: data.sub, name: data.name, picture: data.picture };
}

// ════════════════════════════════════════════════════════════════════
//  LINE 公式アカウント（Messaging API）
//  必要な環境変数：
//    LINE_MESSAGING_CHANNEL_ACCESS_TOKEN … 公式アカウントのチャネルアクセストークン（長期）
//    LINE_MESSAGING_CHANNEL_SECRET       … Webhook の署名検証に使うチャネルシークレット
//  未設定の場合は送信せずログだけ出す（開発・デモ環境）。
// ════════════════════════════════════════════════════════════════════

const API = "https://api.line.me/v2/bot";

export function isMessagingConfigured() {
  return !!process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN;
}

/** 通知からアプリの画面を開く URL。LIFF があれば LINE 内で開く（https://liff.line.me/{id}/path）。 */
export function appUrl(path: string) {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (liffId) return `https://liff.line.me/${liffId}${path}`;
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}

type LineMessage = Record<string, unknown>;

/** 通知1件ぶんのメッセージ（タイトル・本文・「アプリで確認する」ボタンのカード） */
export function notificationMessage(title: string, body: string, path: string): LineMessage {
  return {
    type: "flex",
    altText: `${title}｜サツコイ！`,
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          { type: "text", text: "サツコイ！", size: "xs", color: "#ee3f9b", weight: "bold" },
          { type: "text", text: title, size: "md", weight: "bold", wrap: true, color: "#111111" },
          { type: "text", text: body, size: "sm", wrap: true, color: "#555555" },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#ee3f9b",
            height: "sm",
            action: { type: "uri", label: "アプリで確認する", uri: appUrl(path) },
          },
        ],
      },
    },
  };
}

export type PushResult = { ok: true } | { ok: false; status: number; error: string };

/** 1人の LINE ユーザーへプッシュ送信（未設定なら送らずに ok を返す＝スタブ）。 */
export async function pushLineMessage(to: string, messages: LineMessage[]): Promise<PushResult> {
  const token = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    console.info(`[LINE STUB] push -> ${to}: ${JSON.stringify(messages).slice(0, 120)}…`);
    return { ok: true };
  }
  const res = await fetch(`${API}/message/push`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ to, messages }),
    cache: "no-store",
  });
  if (res.ok) return { ok: true };
  return { ok: false, status: res.status, error: (await res.text()).slice(0, 300) };
}

/** Webhook の応答（replyToken を使う返信。月間の配信数にはカウントされない）。 */
export async function replyLineMessage(replyToken: string, messages: LineMessage[]) {
  const token = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN;
  if (!token) return;
  await fetch(`${API}/message/reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ replyToken, messages }),
    cache: "no-store",
  }).catch((e) => console.error("[LINE] reply failed", e));
}

/** Webhook の署名（X-Line-Signature）を検証する。 */
export async function verifyLineSignature(rawBody: string, signature: string | null) {
  const secret = process.env.LINE_MESSAGING_CHANNEL_SECRET;
  if (!secret || !signature) return false;
  const { createHmac, timingSafeEqual } = await import("node:crypto");
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  const given = Buffer.from(signature, "base64");
  return given.length === expected.length && timingSafeEqual(given, expected);
}
