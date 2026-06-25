import { prisma } from "@/lib/db";
import type { AdPosition } from "@prisma/client";

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
          className="block overflow-hidden rounded-2xl border border-line bg-surface"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="h-auto w-full object-cover"
          />
          <span className="block px-3 py-1.5 text-[11px] text-ink-faint">
            広告・{ad.title}
          </span>
        </a>
      ))}
    </div>
  );
}
