import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { IS_DEMO } from "@/lib/demo";
import { AppHeader } from "@/components/member/AppHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const ITEMS = [
  { href: "/notifications", label: "お知らせ", icon: "🔔" },
  { href: "/info/terms", label: "利用規約", icon: "📄" },
  { href: "/info/privacy", label: "プライバシーポリシー", icon: "🔒" },
  { href: "/info/company", label: "運営会社", icon: "🏢" },
  { href: "/contact", label: "お問い合わせ", icon: "✉" },
];

export default async function MenuPage() {
  await requireMember();

  return (
    <div className="flex flex-1 flex-col pb-10">
      <AppHeader title="メニュー" />

      <div className="space-y-4 px-4 py-4">
        <Card>
          <nav className="divide-y divide-line">
            {ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-canvas"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-sm text-primary">
                  {item.icon}
                </span>
                <span className="flex-1 text-sm font-medium text-ink">
                  {item.label}
                </span>
                <span className="text-ink-faint">›</span>
              </Link>
            ))}
          </nav>
        </Card>

        {!IS_DEMO && (
          <form action="/logout" method="post">
            <Button type="submit" variant="outline" size="lg">
              ログアウト
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
