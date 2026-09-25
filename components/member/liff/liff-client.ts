"use client";

// ════════════════════════════════════════════════════════════════════
//  LIFF クライアント（ブラウザ側）
//  NEXT_PUBLIC_LIFF_ID が未設定なら何もしない＝通常の Web アプリとして動作
//  （GitHub Pages のデモもこの状態）。
// ════════════════════════════════════════════════════════════════════

import type { Liff } from "@line/liff";

export const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID ?? "";

let ready: Promise<Liff | null> | null = null;

/** LIFF を1度だけ初期化して返す。未設定・初期化失敗時は null。 */
export function getLiff(): Promise<Liff | null> {
  if (!LIFF_ID) return Promise.resolve(null);
  ready ??= import("@line/liff")
    .then(async ({ default: liff }) => {
      await liff.init({ liffId: LIFF_ID });
      return liff;
    })
    .catch((e) => {
      console.error("[LIFF] 初期化に失敗しました", e);
      return null;
    });
  return ready;
}
