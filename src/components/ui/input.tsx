import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-md bg-input px-3 text-sm text-foreground placeholder:text-subtle",
        "shadow-[0_0_0_1px_rgba(236,234,228,0.10)] outline-none transition-[box-shadow] duration-150",
        "focus-visible:shadow-[0_0_0_1px_rgba(197,204,196,0.7)]",
        "disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-20 w-full rounded-md bg-input px-3 py-2 text-sm text-foreground placeholder:text-subtle",
        "shadow-[0_0_0_1px_rgba(236,234,228,0.10)] outline-none transition-[box-shadow] duration-150",
        "focus-visible:shadow-[0_0_0_1px_rgba(197,204,196,0.7)]",
        "disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}
