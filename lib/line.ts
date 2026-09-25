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
