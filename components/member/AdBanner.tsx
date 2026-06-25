import { prisma } from "@/lib/db";
import type { AdPosition } from "@prisma/client";
import { AdImage } from "@/components/member/AdImage";

/**
 * 広告バナー（サーバー部品）。
 * 指定 position の有効な広告を sortOrder 昇順で表示。無ければ何も出さない。
 */
export async function AdBanner({ position }: { position: AdPosition }) {
  const ads = await prisma.ad.findMany({
    where: { isEnabled: true, position },
    orderBy: { sortOrder: "asc" },
  });

  if (ads.length === 0) return null;

  return (
    <div className="space-y-2">
      {ads.map((ad) => (
        <a
          key={ad.id}
          href={ad.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block overflow-hidden rounded-2xl border border-line/70 bg-surface shadow-[var(--shadow-card)]"
        >
          <span className="absolute left-2 top-2 z-10 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
            広告
          </span>
          <AdImage url={ad.imageUrl} title={ad.title} />
          <span className="block px-3 py-1.5 text-[11px] text-ink-faint">
            {ad.title}
          </span>
        </a>
      ))}
    </div>
  );
}
