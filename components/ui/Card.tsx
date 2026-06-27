import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
  as: Tag = "div",
  accent = false,
}: {
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
  /** 上辺にゴールドのアクセントラインを引く（重要カード用） */
  accent?: boolean;
}) {
  return (
    <Tag
      className={cn(
        "relative bg-surface border border-line rounded-[var(--radius-card)]",
        accent && "overflow-hidden",
        className
      )}
    >
      {accent && (
        <span className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gold" />
      )}
      {children}
    </Tag>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

export function SectionTitle({
  children,
  className,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("flex items-center justify-between px-1 mb-2", className)}>
      <h2 className="text-display text-sm font-medium text-ink-soft">{children}</h2>
      {action}
    </div>
  );
}
