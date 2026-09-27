"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { IconHeart } from "@/components/member/icons";

/**
 * いいねボタン（ハートがポンと弾んで、周りに小さな粒が広がる）。
 * action は Server Action。静的デモでは undefined になり、見た目だけ切り替わる。
 */
export function LikeButton({
  targetId,
  initialLiked,
  action,
  size = "lg",
  className,
}: {
  targetId: string;
  initialLiked: boolean;
  action?: (targetId: string) => Promise<{ ok: boolean }>;
  size?: "md" | "lg";
  className?: string;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [burst, setBurst] = useState(0);
  const [pending, start] = useTransition();

  const onClick = () => {
    if (liked || pending) return;
    setLiked(true);
    setBurst((n) => n + 1);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(12);
    if (!action) return;
    start(async () => {
      const res = await action(targetId).catch(() => ({ ok: false }));
      if (!res.ok) setLiked(false);
    });
  };

  const dim = size === "lg" ? "h-11 w-11" : "h-9 w-9";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={liked}
      aria-label={liked ? "いいね済み" : "いいね"}
      className={cn(
        "press relative inline-flex shrink-0 items-center justify-center rounded-full border transition-colors duration-200",
        liked ? "border-transparent bg-danger-soft text-like" : "border-line bg-surface text-ink",
        dim,
        className
      )}
    >
      <IconHeart
        filled={liked}
        key={burst}
        className={cn(size === "lg" ? "h-6 w-6" : "h-5 w-5", burst > 0 && "animate-heart-pop")}
      />
      {burst > 0 && (
        <span key={`b${burst}`} aria-hidden className="heart-burst pointer-events-none absolute inset-0">
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} style={{ "--a": `${i * 45}deg` } as React.CSSProperties} />
          ))}
        </span>
      )}
    </button>
  );
}
