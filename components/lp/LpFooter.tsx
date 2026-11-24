import Link from "next/link";
import { BrandMark } from "@/components/member/BrandMark";
import { SERVICE_NAME } from "@/lib/constants";
import { LP_CONTAINER } from "./LpSection";

// お問い合わせ（/contact）は会員ログインが必要なページのため、訪問者向けのフッターには載せない
const LINKS = [
  { href: "/info/faq", label: "よくある質問" },
  { href: "/info/terms", label: "利用規約" },
  { href: "/info/privacy", label: "プライバシーポリシー" },
  { href: "/info/company", label: "運営会社" },
];

export function LpFooter() {
  return (
    <footer className="border-t border-line bg-canvas py-10 md:py-12">
      <div className={`${LP_CONTAINER} flex flex-col gap-6 md:flex-row md:items-center md:justify-between`}>
        <div className="flex items-center gap-2">
          <BrandMark className="h-7 w-7" />
          <span className="text-sm font-bold text-ink">{SERVICE_NAME}</span>
        </div>
        <nav aria-label="サイト情報">
          {/* リンクは高さ 40px を確保して、スマホでも押しやすくする */}
          <ul className="-my-2 flex flex-wrap gap-x-6 gap-y-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-flex min-h-10 items-center text-sm text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className={`${LP_CONTAINER} mt-8 text-xs text-ink-soft`}>© {SERVICE_NAME}</p>
    </footer>
  );
}
