import { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-10 w-full rounded-md border border-line bg-panel px-3 text-sm text-ink placeholder:text-muted shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition focus:border-accent ${className}`}
      {...props}
    />
  );
}
