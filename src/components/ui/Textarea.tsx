import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

export default function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-zinc-800 bg-[#0B0F14] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3D2E]",
        className
      )}
      {...props}
    />
  );
}
