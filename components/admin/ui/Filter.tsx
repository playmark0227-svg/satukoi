"use client";

// ════════════════════════════════════════════════════════════════════
//  一覧の絞り込み（端末内で動く。静的デモでもそのまま使える）
//
//  <FilterScope params={["status"]}>          ← URL の ?status=… ?q=… を初期値に使い、操作で URL も更新
//    <FilterBar>
//      <SearchField placeholder="名前・メールで検索" />
//      <FilterChips name="status" options={[{ value: "ACTIVE", label: "有効", count: 10 }]} />
//      <ToggleChip name="attention" label="要対応のみ" count={3} />
//    </FilterBar>
//    <FilterSummary unit="名" />
//    …<FilterRow id={m.id} as="tr" search="山本 みさき misaki@" facets={{ status: m.status, attention: true }}>…
//    <FilterEmpty>条件に合う会員はいません</FilterEmpty>
//  </FilterScope>
//
//  同じ項目を表（PC）と一覧（スマホ）の両方に出すときは、同じ id を渡す（件数は id 単位で数える）。
// ════════════════════════════════════════════════════════════════════

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { IconSearch } from "@/components/member/icons";

type Facets = Record<string, string>;
type FacetValue = string | string[] | boolean | null | undefined;

type Ctx = {
  q: string;
  facets: Facets;
  setQ: (q: string) => void;
  setFacet: (name: string, value: string) => void;
  clear: () => void;
  report: (id: string, visible: boolean) => void;
  unreport: (id: string) => void;
  visible: number;
  total: number;
};

const FilterCtx = createContext<Ctx | null>(null);

function useFilter() {
  const c = useContext(FilterCtx);
  if (!c) throw new Error("FilterScope の中で使ってください");
  return c;
}

/** 検索用の正規化（全角半角・大文字小文字・カタカナ/ひらがなの違いを吸収） */
export function normalizeSearch(s: string) {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

// ── URL を「状態の置き場所」として使う（?q=…&status=…）。replaceState では popstate が来ないので自前で通知する
const urlListeners = new Set<() => void>();
function subscribeUrl(cb: () => void) {
  urlListeners.add(cb);
  window.addEventListener("popstate", cb);
  return () => {
    urlListeners.delete(cb);
    window.removeEventListener("popstate", cb);
  };
}
const getUrlSnapshot = () => window.location.search;
const getServerUrlSnapshot = () => "";
function replaceUrl(url: URL) {
  window.history.replaceState(window.history.state, "", url);
  urlListeners.forEach((l) => l());
}

export function FilterScope({
  params = [],
  children,
}: {
  /** URL と同期する絞り込み名（q は常に同期） */
  params?: string[];
  children: React.ReactNode;
}) {
  // サーバー描画・ハイドレーション時は絞り込みなし（全件表示）→ 直後に URL の条件を反映
  const search = useSyncExternalStore(subscribeUrl, getUrlSnapshot, getServerUrlSnapshot);
  const paramsKey = params.join(",");
  const { q, facets } = useMemo(() => {
    const sp = new URLSearchParams(search);
    const f: Facets = {};
    for (const p of paramsKey ? paramsKey.split(",") : []) {
      const v = sp.get(p);
      if (v) f[p] = v;
    }
    return { q: sp.get("q") ?? "", facets: f };
  }, [search, paramsKey]);

  const reg = useRef(new Map<string, boolean>());
  const [counts, setCounts] = useState({ visible: 0, total: 0 });
  const pending = useRef(false);

  const update = useCallback((nextQ: string, nextF: Facets) => {
    const url = new URL(window.location.href);
    if (nextQ) url.searchParams.set("q", nextQ);
    else url.searchParams.delete("q");
    for (const p of paramsKey ? paramsKey.split(",") : []) {
      if (nextF[p]) url.searchParams.set(p, nextF[p]);
      else url.searchParams.delete(p);
    }
    replaceUrl(url);
  }, [paramsKey]);

  const recount = useCallback(() => {
    if (pending.current) return;
    pending.current = true;
    queueMicrotask(() => {
      pending.current = false;
      let visible = 0;
      for (const v of reg.current.values()) if (v) visible++;
      setCounts((c) =>
        c.visible === visible && c.total === reg.current.size ? c : { visible, total: reg.current.size }
      );
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      q,
      facets,
      setQ: (next) => update(next, facets),
      setFacet: (name, v) => {
        const next = { ...facets, [name]: v };
        if (!v) delete next[name];
        update(q, next);
      },
      clear: () => update("", {}),
      report: (id, visible) => {
        reg.current.set(id, visible);
        recount();
      },
      unreport: (id) => {
        reg.current.delete(id);
        recount();
      },
      visible: counts.visible,
      total: counts.total,
    }),
    [q, facets, counts, update, recount]
  );

  return <FilterCtx.Provider value={value}>{children}</FilterCtx.Provider>;
}

function matches(q: string, facets: Facets, search: string, rowFacets: Record<string, FacetValue>) {
  if (q.trim()) {
    const hay = normalizeSearch(search);
    for (const token of normalizeSearch(q).split(/\s+/).filter(Boolean)) {
      if (!hay.includes(token)) return false;
    }
  }
  for (const [name, want] of Object.entries(facets)) {
    const have = rowFacets[name];
    if (Array.isArray(have)) {
      if (!have.includes(want)) return false;
    } else if (typeof have === "boolean") {
      if (want === "1" ? !have : have) return false;
    } else if (have !== want) {
      return false;
    }
  }
  return true;
}

/** 絞り込み対象の1行（表の <tr> でも、一覧の <li> でも） */
export function FilterRow({
  id,
  as: Tag = "li",
  search = "",
  facets = {},
  className,
  children,
}: {
  id: string;
  as?: "tr" | "li" | "div";
  search?: string;
  facets?: Record<string, FacetValue>;
  className?: string;
  children: React.ReactNode;
}) {
  const { q, facets: active, report, unreport } = useFilter();
  const visible = matches(q, active, search, facets);
  useEffect(() => {
    report(id, visible);
  }, [id, visible, report]);
  useEffect(() => () => unreport(id), [id, unreport]);
  return (
    <Tag hidden={!visible} className={className}>
      {children}
    </Tag>
  );
}

/** 絞り込みの操作を1行（スマホは縦）にまとめる */
export function FilterBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-4 flex flex-col gap-3 lg:flex-row lg:items-center", className)}>{children}</div>;
}

export function SearchField({ placeholder = "検索", label = "キーワードで検索" }: { placeholder?: string; label?: string }) {
  const { q, setQ } = useFilter();
  return (
    <label className="relative block min-w-0 lg:w-80">
      <span className="sr-only">{label}</span>
      <IconSearch className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-soft" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-line bg-surface pr-3 pl-9 text-ink outline-none placeholder:text-ink-faint focus:border-ink"
      />
    </label>
  );
}

const chipBase =
  "press inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold whitespace-nowrap";
const chipActive = "border-ink bg-ink text-white";
const chipIdle = "border-line bg-surface text-ink hover:bg-canvas";

/** 1つだけ選ぶチップ（すべて／有効／書類確認中…）。スマホでも横スクロールにせず折り返して全部見せる */
export function FilterChips({
  name,
  options,
  allLabel = "すべて",
  allCount,
  label,
}: {
  name: string;
  options: { value: string; label: string; count?: number }[];
  allLabel?: string;
  allCount?: number;
  label?: string;
}) {
  const { facets, setFacet } = useFilter();
  const current = facets[name] ?? "";
  const items = [{ value: "", label: allLabel, count: allCount }, ...options];
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex flex-wrap gap-2"
    >
      {items.map((o) => {
        const active = current === o.value;
        return (
          <button
            key={o.value || "_all"}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setFacet(name, o.value)}
            className={cn(chipBase, active ? chipActive : chipIdle)}
          >
            {o.label}
            {o.count != null && <span className="num-tnum text-xs opacity-75">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** ON/OFF のチップ（要対応のみ など）。件数が1以上なら OFF でも黄色で目立たせる */
export function ToggleChip({ name, label, count }: { name: string; label: string; count?: number }) {
  const { facets, setFacet } = useFilter();
  const on = facets[name] === "1";
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setFacet(name, on ? "" : "1")}
      className={cn(
        chipBase,
        on
          ? chipActive
          : count && count > 0
            ? "border-warning/50 bg-warning-soft text-warning-strong hover:bg-warning-soft/70"
            : chipIdle
      )}
    >
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden>
        {on ? <path d="M4 10.5l4 4 8-8.5" /> : <circle cx="10" cy="10" r="6" />}
      </svg>
      {label}
      {count != null && <span className="num-tnum text-xs">{count}</span>}
    </button>
  );
}

/** 「該当 N 件」と、絞り込み中なら解除ボタン */
export function FilterSummary({ unit = "件", className }: { unit?: string; className?: string }) {
  const { visible, total, q, facets, clear } = useFilter();
  const filtering = !!q.trim() || Object.keys(facets).length > 0;
  return (
    <div className={cn("mb-2 flex items-center gap-3 text-[13px] text-ink-soft", className)}>
      <span className="num-tnum" aria-live="polite">
        {filtering ? (
          <>
            該当 <b className="text-ink">{visible}</b> / {total} {unit}
          </>
        ) : (
          <>
            全 <b className="text-ink">{total}</b> {unit}
          </>
        )}
      </span>
      {filtering && (
        <button type="button" onClick={clear} className="font-semibold text-primary-text hover:underline">
          絞り込みを解除
        </button>
      )}
    </div>
  );
}

/** 絞り込みの結果が0件のときだけ表示 */
export function FilterEmpty({ children }: { children: React.ReactNode }) {
  const { visible, total } = useFilter();
  if (total === 0 || visible > 0) return null;
  return (
    <p className="rounded-[var(--radius-card)] border border-dashed border-line bg-surface px-4 py-8 text-center text-sm text-ink-soft">
      {children}
    </p>
  );
}
