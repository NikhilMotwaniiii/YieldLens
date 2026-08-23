import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "onDark" | "onDarkGhost";
};

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  const variants = {
    primary: "bg-night text-panel shadow-[inset_0_-2px_0_rgba(255,255,255,0.12)] hover:bg-night-soft",
    secondary: "border border-line bg-panel text-ink hover:border-accent hover:bg-accent-soft",
    ghost: "text-ink hover:bg-panel/80",
    danger: "border border-[#efb0aa] bg-panel text-loss hover:bg-[#fff0ee]",
    onDark: "bg-panel text-night shadow-[inset_0_-2px_0_rgba(17,21,15,0.10)] hover:bg-[#f4e7c8]",
    onDarkGhost: "border border-panel/25 bg-transparent text-panel hover:bg-panel/15"
  };
  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
