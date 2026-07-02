export function EmptyState({
  title,
  description,
  icon = "♡",
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="animate-fade-up flex flex-col items-center justify-center px-6 py-14 text-center">
      <div
        className="animate-float mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface-alt text-2xl text-gold"
        style={{ boxShadow: "inset 0 0 0 1px var(--color-gold-soft)" }}
      >
        {icon}
      </div>
      <p className="text-display font-medium text-ink">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-ink-soft">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
