"use client";

import { useRouter } from "next/navigation";

type NavigationLike = { canGoBack?: boolean };

/** 1つ前の履歴が、このサイトの中のページか */
function cameFromThisSite(): boolean {
  // Navigation API（対応ブラウザ）：同じオリジンの履歴だけが数えられる
  const nav = (window as Window & { navigation?: NavigationLike }).navigation;
  if (nav && typeof nav.canGoBack === "boolean") return nav.canGoBack;
  // 非対応ブラウザ：同じサイトから開かれたときだけ
  try {
    return (
      window.history.length > 1 &&
      !!document.referrer &&
      new URL(document.referrer).origin === window.location.origin
    );
  } catch {
    return false;
  }
}

/**
 * 中のヘッダー（AppHeader）の「戻る」を、サイト内から来たときはブラウザの「戻る」と同じ動きにする。
 * ・LP のフッターから来た訪問者 → LP（デモでも LP に戻れる）
 * ・会員メニューから来た会員 → メニュー
 * 直接開いたとき（履歴がない・外部から来た）は、リンク本来の行き先（infoBackHref）へ進む。
 * ラッパーは display: contents なので、ヘッダーの sticky はそのまま効く。
 */
export function HistoryBack({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <div
      className="contents"
      onClickCapture={(e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const back = (e.target as Element).closest('a[aria-label="戻る"]');
        if (!back || !cameFromThisSite()) return;
        e.preventDefault();
        e.stopPropagation();
        router.back();
      }}
    >
      {children}
    </div>
  );
}
