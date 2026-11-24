import { getCurrentMemberId } from "@/lib/auth";
import { IS_DEMO } from "@/lib/demo";

/**
 * 規約・運営会社などの公開ページの「戻る」先。
 * ・ログイン中の会員（デモはログイン中扱い）→ メニュー
 * ・未ログインの訪問者（LP のフッターから来た人）→ トップ（LP）
 */
export async function infoBackHref(): Promise<string> {
  if (IS_DEMO) return "/menu";
  return (await getCurrentMemberId()) ? "/menu" : "/";
}
