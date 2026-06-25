"use client";

import { useEffect, useState } from "react";

/** 0 から value まで数字をカウントアップ（マウント時に1回）。 */
export function CountUp({
  value,
  className,
  duration = 900,
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (value <= 0) {
      setN(0);
      return;
    }
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setN(value);
      return;
    }
    let raf = 0;
    let startTs = 0;
    const step = (ts: number) => {
      if (!startTs) startTs = ts;
      const p = Math.min(1, (ts - startTs) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className}>{n}</span>;
}
