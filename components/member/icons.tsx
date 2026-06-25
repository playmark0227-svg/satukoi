// シンプルな SVG アイコン群（デザイン合わせ用）。currentColor で色を継承。
type P = { className?: string };

export function IconSparkle({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2l1.8 4.9L18.7 8 13.8 9.8 12 14.7 10.2 9.8 5.3 8l4.9-1.1L12 2z" />
      <path d="M18.5 14l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.4z" />
    </svg>
  );
}

export function IconBell({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

export function IconFunnel({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 4h18l-7 8.5V20l-4 1v-8.5L3 4z" />
    </svg>
  );
}

export function IconHome({ className, filled }: P & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
    </svg>
  );
}

export function IconHeart({ className, filled }: P & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 20s-7-4.5-9.5-9C1 8 2.5 4.5 6 4.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 15.5 12 20 12 20z" />
    </svg>
  );
}

export function IconUser({ className, filled }: P & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" />
    </svg>
  );
}

export function IconMenu({ className }: P & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={className} aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

/** 本人確認済バッジ（緑の盾＋チェック） */
export function BadgeVerified({ className }: P) {
  return (
    <span className={"inline-flex h-5 w-5 items-center justify-center rounded-full bg-success text-white " + (className ?? "")} title="本人確認済">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden>
        <path d="M4 12l5 5L20 6" />
      </svg>
    </span>
  );
}

/** サロン会員バッジ（王冠） */
export function BadgeCrown({ className }: P) {
  return (
    <span className={"inline-flex h-5 w-5 items-center justify-center rounded-full text-white " + (className ?? "")} style={{ background: "var(--color-accent-violet)" }} title="サロン会員">
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3" aria-hidden>
        <path d="M3 7l4 4 5-6 5 6 4-4v11H3V7z" />
      </svg>
    </span>
  );
}
