import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export default function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-[#223042] bg-[#121826]", className)} {...props} />;
}
