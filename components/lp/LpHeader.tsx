import Link from "next/link";
import { BrandMark } from "@/components/member/BrandMark";
import { SERVICE_NAME } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { LpStartButton } from "./LpCta";
import { LP_CONTAINER } from "./LpSection";

const NAV = [
  { href: "#flow", label: "ご利用の流れ" },
  { href: "#pricing", label: "料金" },
  { href: "#area", label: "対象エリア" },
  { href: "#faq", label: "よくある質問" },
];

/** LP 上部の固定ヘッダー：左にロゴ、右にログインと「はじめる」。PC はページ内リンクも */
export function LpHeader({ demo, loginHref }: { demo: boolean; loginHref: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      {/* 左右の余白は本文（LP_CONTAINER）とそろえる */}
      <div className={cn(LP_CONTAINER, "flex h-14 items-center gap-2 sm:gap-3")}>
        {/* 375px でもロゴ名（サツコイ！（仮））が切れないよう、SP ではロゴと余白を少し詰める */}
        <Link href="/" className="flex min-w-0 items-center gap-1.5 sm:gap-2" aria-label={`${SERVICE_NAME} トップ`}>
          <BrandMark className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
          <span className="truncate text-[15px] font-bold text-ink">{SERVICE_NAME}</span>
        </Link>

        <nav aria-label="ページ内" className="ml-6 hidden items-center gap-6 lg:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href={loginHref}
            className="rounded-lg px-1.5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-alt sm:px-2.5"
          >
            ログイン
          </Link>
          {/* 幅の狭い端末（375px 未満）はロゴ名を優先し、はじめるボタンはヒーローと最下部に任せる */}
          <LpStartButton demo={demo} size="sm" className="max-[374px]:hidden" />
        </div>
      </div>
    </header>
  );
}
