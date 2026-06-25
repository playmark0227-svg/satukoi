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
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-2xl text-primary">
        {icon}
      </div>
      <p className="font-bold text-ink">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-ink-soft">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
