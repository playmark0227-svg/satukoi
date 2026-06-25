import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
  as: Tag = "div",
}: {
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
}) {
  return (
    <Tag
      className={cn(
        "bg-surface border border-line/70 rounded-[var(--radius-card)] shadow-[var(--shadow-card)]",
        className
      )}
    >
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
  return <div className={cn("p-4", className)}>{children}</div>;
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
      <h2 className="text-sm font-bold text-ink-soft">{children}</h2>
      {action}
    </div>
  );
}
