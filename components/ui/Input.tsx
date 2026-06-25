"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

const fieldClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 h-12 text-ink placeholder:text-ink-faint outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft disabled:bg-canvas disabled:text-ink-faint";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(fieldClass, className)} {...props} />;
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(fieldClass, "h-auto min-h-24 py-2.5 leading-relaxed", className)}
      {...props}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(fieldClass, "appearance-none bg-no-repeat", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%239aa0b4' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>\")",
        backgroundPosition: "right 0.75rem center",
      }}
      {...props}
    >
      {children}
    </select>
  );
});
