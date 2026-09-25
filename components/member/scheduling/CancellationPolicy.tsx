import { CANCELLATION_POLICY_FULL } from "@/lib/constants";

/**
 * キャンセルポリシー全文の整形表示（サーバー部品）。
 * デートキャンセル操作時に必ず表示する。
 */
export function CancellationPolicy() {
  return (
    <div className="space-y-2.5">
      {CANCELLATION_POLICY_FULL.map((section) => (
        <div key={section.title} className="rounded-2xl border border-line bg-canvas p-3.5">
          <p className="text-[13px] font-bold leading-snug text-ink">{section.title}</p>
          <ul className="mt-2 space-y-1">
            {section.rows.map((row, i) =>
              row.startsWith("※") ? (
                <li key={i} className="pt-0.5 text-[11px] leading-relaxed text-ink-faint">
                  {row}
                </li>
              ) : (
                <li key={i} className="flex gap-1.5 text-xs leading-relaxed text-ink-soft">
                  <span aria-hidden className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
                  <span>{row}</span>
                </li>
              )
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}
