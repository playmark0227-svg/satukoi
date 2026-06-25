import { cn } from "@/lib/cn";

export function Field({
  label,
  hint,
  error,
  required,
  locked,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** 登録後に編集不可な項目（仕様：信頼性担保） */
  locked?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-center gap-2 text-sm font-bold text-ink">
        {label}
        {required && <span className="text-primary text-xs">必須</span>}
        {locked && (
          <span className="rounded bg-line px-1.5 py-0.5 text-[10px] font-medium text-ink-faint">
            登録後編集不可
          </span>
        )}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}
