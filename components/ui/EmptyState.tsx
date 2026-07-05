import Image from "next/image";
import mark from "@/public/logo-mark.png";

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="animate-fade-up flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-surface-alt text-2xl">
        {icon ?? (
          <Image src={mark} alt="" sizes="32px" className="h-7 w-7 object-contain opacity-80" />
        )}
      </div>
      <p className="font-bold text-ink">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-ink-soft">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
