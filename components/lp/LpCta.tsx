"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { LIFF_ID, getLiff } from "@/components/member/liff/liff-client";
import { LineIcon } from "@/components/member/liff/LineLoginButton";

type Size = "lg" | "sm";

const base =
  "press inline-flex items-center justify-center whitespace-nowrap rounded-lg font-bold text-white disabled:opacity-60";
const sizes: Record<Size, string> = {
  lg: "h-12 w-full gap-2 px-6 text-base sm:w-auto sm:min-w-64",
  // ヘッダー用も 14px 以上（白文字の読みやすさ）
  sm: "h-9 gap-1 px-2 text-sm min-[390px]:px-2.5 sm:gap-1.5 sm:px-3",
};
// #06C755 は LINE のブランド公式色。LINE の操作ボタンだけに使う（面塗り・文字には使わない）
const lineTone = "bg-[#06C755] hover:brightness-105";
// 白文字とのコントラストを取るため、明るい primary（#0095f6）ではなく primary-strong を地にする
const plainTone = "bg-primary-strong hover:bg-primary-text";

/** sm（ヘッダー）では SP で短いラベルにして、ロゴ・ログインと1行に収める */
function Label({ full, short, size }: { full: string; short: string; size: Size }) {
  if (size === "lg") return <>{full}</>;
  return (
    <>
      <span className="sm:hidden">{short}</span>
      <span className="hidden sm:inline">{full}</span>
    </>
  );
}

/**
 * LP の主ボタン（はじめる）。
 * ・デモ（GitHub Pages）：ログインなしでアプリ画面（/users）へ進む
 * ・LIFF 設定済み：LINE ログインを開始（戻ってきたら layout の LiffAutoLogin がセッションを発行して画面を進める）
 * ・LIFF 未設定の本番：LINE が使えないので、LINE 色ではない通常の「会員登録」ボタン（/register）
 *   ※ このとき LP 側は「メールアドレスで登録」を出さない（同じ行き先のボタンを2つ並べない）
 */
export function LpStartButton({
  demo,
  size = "lg",
  className,
}: {
  demo: boolean;
  size?: Size;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const iconCls = size === "lg" ? "h-5 w-5" : "h-4 w-4";

  if (demo) {
    return (
      <Link href="/users" className={cn(base, sizes[size], lineTone, className)}>
        <LineIcon className={iconCls} />
        <Label full="LINEではじめる" short="はじめる" size={size} />
      </Link>
    );
  }

  if (!LIFF_ID) {
    return (
      <Link href="/register" className={cn(base, sizes[size], plainTone, className)}>
        <Label full="会員登録をはじめる" short="会員登録" size={size} />
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      className={cn(base, sizes[size], lineTone, className)}
      onClick={async () => {
        setBusy(true);
        const liff = await getLiff();
        if (!liff) return setBusy(false);
        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }
        // すでに LINE ログイン済み：自動ログイン処理（LiffAutoLogin）に任せて再読み込み
        window.location.reload();
      }}
    >
      <LineIcon className={iconCls} />
      {busy ? "LINEに接続中…" : <Label full="LINEではじめる" short="はじめる" size={size} />}
    </button>
  );
}
