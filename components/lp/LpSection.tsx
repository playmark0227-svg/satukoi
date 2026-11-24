import { cn } from "@/lib/cn";

/** LP の本文幅（PC で約1080px）と左右の余白。ヘッダー・フッターも同じ幅にそろえる */
export const LP_CONTAINER = "mx-auto w-full max-w-[1080px] px-5 md:px-8";

/** LP の本文（SP 15px → PC 17px、行間ゆったり） */
export const LP_BODY = "text-[15px] leading-[1.85] md:text-base lg:text-[17px]";

/**
 * LP のセクション（全幅の帯）。白（surface）と薄いグレー（canvas）を交互に使い、まとまりを分ける。
 * 見出し（h2）はカードの外に置く。
 */
export function LpSection({
  id,
  tone = "surface",
  title,
  lead,
  split,
  className,
  children,
}: {
  id?: string;
  tone?: "surface" | "canvas";
  title: string;
  lead?: React.ReactNode;
  /** PC（lg 以上）で見出しを左、中身を右に並べる（FAQ など縦に長い読み物向け） */
  split?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        "scroll-mt-14 border-t border-line py-14 md:py-20 lg:py-24",
        tone === "canvas" ? "bg-canvas" : "bg-surface",
        className
      )}
    >
      <div
        className={cn(
          LP_CONTAINER,
          split && "lg:grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,2fr)] lg:items-start lg:gap-16"
        )}
      >
        <div className={cn("mb-8 max-w-2xl md:mb-12", split && "lg:sticky lg:top-24 lg:mb-0")}>
          <h2
            id={headingId}
            className="text-2xl leading-snug font-bold tracking-tight text-ink md:text-[32px]"
          >
            {title}
          </h2>
          {lead && <p className={cn("mt-3 text-ink-soft md:mt-4", LP_BODY)}>{lead}</p>}
        </div>
        {split ? <div className="min-w-0">{children}</div> : children}
      </div>
    </section>
  );
}

/** アイコンの四角い台（components/member/icons.tsx のアイコンを載せる） */
export function IconTile({
  children,
  size = "md",
}: {
  children: React.ReactNode;
  size?: "md" | "lg";
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-surface-alt text-ink",
        size === "lg" ? "h-12 w-12 [&>svg]:h-6 [&>svg]:w-6" : "h-11 w-11 [&>svg]:h-[22px] [&>svg]:w-[22px]"
      )}
    >
      {children}
    </span>
  );
}
