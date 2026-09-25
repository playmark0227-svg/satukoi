"use client";

import Link from "next/link";
import { useState } from "react";
import { LIFF_ID, getLiff } from "./liff-client";

/** LINE公式のフキダシをかたどったシンプルなアイコン（単色・currentColor） */
export function LineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 3.2c-5.3 0-9.6 3.5-9.6 7.83 0 3.87 3.43 7.1 8.06 7.72.31.07.74.21.85.48.1.24.06.61.03.86l-.13.82c-.04.24-.2.96.84.52 1.04-.43 5.61-3.3 7.65-5.66 1.41-1.55 1.9-3.12 1.9-4.74 0-4.33-4.3-7.83-9.6-7.83z" />
    </svg>
  );
}

const cls =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#06C755] px-5 text-[15px] font-semibold whitespace-nowrap text-white transition-opacity active:opacity-80";

/**
 * LINE でログイン。
 * ・LIFF 設定済み：LINE ログイン画面へ（戻ってきたら LiffAutoLogin がセッションを発行）
 * ・デモ（GitHub Pages）：ログイン後の画面（ホーム）へそのまま進む
 * ※ #06C755 は LINE のブランド公式色（このボタンのみに使用）
 */
export function LineLoginButton({ demo, label = "LINEでログイン" }: { demo: boolean; label?: string }) {
  const [busy, setBusy] = useState(false);

  if (!LIFF_ID) {
    return demo ? (
      <Link href="/users" className={cls}>
        <LineIcon className="h-5 w-5" />
        {label}
      </Link>
    ) : (
      <button type="button" disabled className={cls + " opacity-50"} title="LIFF ID 未設定">
        <LineIcon className="h-5 w-5" />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      className={cls}
      onClick={async () => {
        setBusy(true);
        const liff = await getLiff();
        if (!liff) return setBusy(false);
        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }
        // すでに LINE ログイン済み：自動ログイン処理に任せて再読み込み
        window.location.reload();
      }}
    >
      <LineIcon className="h-5 w-5" />
      {busy ? "LINEに接続中…" : label}
    </button>
  );
}
