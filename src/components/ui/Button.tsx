import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

export default function Button({
  className,
  variant = "primary",
  type = "button",
  disabled,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; children?: ReactNode }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3D2E] focus-visible:ring-offset-0 disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-[#FF3D2E] text-white hover:brightness-110",
    secondary: "border border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-900/50",
    danger: "bg-red-600 text-white hover:bg-red-500",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(base, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}
