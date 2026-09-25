import Link from "next/link";
import { requireMember } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/member/AppHeader";
import { Card, CardBody, SectionTitle } from "@/components/ui/Card";
import { IconCoffee, IconMapPin, IconScissors, IconChevronRight } from "@/components/member/icons";

/** 地図アプリで住所を開くリンク（Google マップの検索URL） */
const mapUrl = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

/** 提携パートナー：デートで利用する提携カフェ（運営が店舗を手配）と提携サロン。 */
export default async function PartnersPage() {
  await requireMember();

  const stores = await prisma.store.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-1 flex-col pb-8">
      <AppHeader title="提携パートナー" backHref="/matches" />

      <div className="stagger space-y-5 px-4 py-4">
        <Card>
          <CardBody className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-alt text-ink-soft">
              <IconCoffee className="h-5 w-5" />
            </span>
            <p className="text-sm leading-relaxed text-ink-soft">
              デートの日程が確定すると、運営が下記の提携カフェから
              <span className="font-bold text-ink">お席を予約</span>
              します。当日はお店のお席で待ち合わせてください。
            </p>
          </CardBody>
        </Card>

        <section>
          <SectionTitle
            action={<span className="num-tnum text-xs text-ink-faint">{stores.length}店舗</span>}
          >
            提携カフェ
          </SectionTitle>
          <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line/80 bg-surface shadow-[var(--shadow-card)]">
            {stores.map((s) => (
              <li key={s.id}>
                <a
                  href={mapUrl(s.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-canvas active:bg-surface-alt"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[15px] font-bold text-ink">{s.name}</p>
                      {s.area && (
                        <span className="shrink-0 rounded-full bg-surface-alt px-2 py-0.5 text-[11px] font-bold text-ink-soft">
                          {s.area}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-[13px] text-ink-soft">
                      <IconMapPin className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                      <span className="truncate">{s.address}</span>
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-primary-strong">地図</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section id="salon" className="scroll-mt-16">
          <SectionTitle>提携サロン</SectionTitle>
          <Card>
            <CardBody className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-alt text-ink-soft">
                <IconScissors className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-ink">ビューティーサロンLUXE札幌</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                  デート前のヘアセット・メイクが20%OFF。サツコイ会員さま限定の特典です。
                </p>
                <Link
                  href="/tickets"
                  className="mt-2 inline-flex items-center gap-0.5 text-[13px] font-bold text-primary-strong"
                >
                  保有しているギフト券を見る
                  <IconChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardBody>
          </Card>
          <p className="mt-2 px-1 text-[11px] leading-relaxed text-ink-faint">
            ※ 掲載の店舗・特典内容はデモ用のサンプルです。
          </p>
        </section>
      </div>
    </div>
  );
}
