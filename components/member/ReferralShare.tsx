"use client";

import { useState } from "react";
import { IconCheck, IconCopy } from "./icons";

/** 紹介コードの表示＋コピー＋LINEで送る */
export function ReferralShare({ code, shareText }: { code: string; shareText: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // クリップボード非対応環境では何もしない（コードは画面に表示済み）
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-line bg-surface-alt/60 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-ink-faint">あなたの紹介コード</p>
          <p className="num-tnum mt-1 font-mono text-2xl font-bold tracking-widest text-ink">
            {code}
          </p>
        </div>
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-[13px] font-bold text-ink transition-colors hover:bg-canvas active:scale-[0.97]"
        >
          {copied ? (
            <>
              <IconCheck className="h-4 w-4 text-success" />
              コピー済み
            </>
          ) : (
            <>
              <IconCopy className="h-4 w-4" />
              コピー
            </>
          )}
        </button>
      </div>
      <a
        href={`https://line.me/R/share?text=${encodeURIComponent(shareText)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#06C755] text-[15px] font-bold text-white transition-all hover:brightness-105 active:scale-[0.98]"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
          <path d="M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.3 7.9.3.1.8.2.9.5.1.3.1.7 0 1l-.1.9c0 .3-.2 1 .9.5s6-3.5 8.2-6C21.4 14.3 22 12.7 22 11c0-4.4-4.5-8-10-8z" />
        </svg>
        LINEで紹介コードを送る
      </a>
    </div>
  );
}
