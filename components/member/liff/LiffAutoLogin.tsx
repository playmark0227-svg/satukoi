"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLiff } from "./liff-client";

const DONE_KEY = "satukoi:liff-auth";

/**
 * LINE アプリ内（LIFF）で開かれたら自動でログインする。
 * ・LINE にログイン済みなら ID トークンをサーバーへ送って会員セッションを発行
 * ・同じタブでは1回だけ実行（sessionStorage）
 * ・LIFF 未設定の環境では何もしない
 */
export function LiffAutoLogin({ hasSession }: { hasSession: boolean }) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const liff = await getLiff();
      if (!liff || cancelled || !liff.isLoggedIn()) return;
      try {
        if (sessionStorage.getItem(DONE_KEY) === "1" && hasSession) return;
      } catch {
        // sessionStorage が使えない環境でも続行
      }
      const idToken = liff.getIDToken();
      if (!idToken) return;
      const res = await fetch("/api/auth/line", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok || cancelled) return;
      try {
        sessionStorage.setItem(DONE_KEY, "1");
      } catch {}
      const { next } = (await res.json()) as { next: string | null };
      if (next) {
        router.replace(next);
        router.refresh();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasSession, router]);

  return null;
}
