import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg transition-colors duration-150 active:opacity-70 disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap";

// Instagram と同じ考え方：主操作はブルー、それ以外はグレーの面ボタン
const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-strong",
  secondary: "bg-surface-alt text-ink hover:bg-line",
  ghost: "bg-transparent text-ink hover:bg-surface-alt",
  danger: "bg-danger text-white hover:brightness-105",
  outline: "border border-line bg-surface text-ink hover:bg-surface-alt",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-4 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-[15px] w-full",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...rest
}: CommonProps & { href: string } & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
  >) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {children}
    </Link>
  );
}
