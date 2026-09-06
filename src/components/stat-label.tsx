"use client";

import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function StatLabel({
  label,
  description,
  align = "start",
}: {
  label: string;
  description?: string;
  align?: "start" | "end";
}) {
  if (!description) return <>{label}</>;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1",
        align === "end" && "justify-end"
      )}
    >
      {label}
      <Tooltip>
        <TooltipTrigger
          aria-label={`What is ${label}?`}
          className="inline-flex shrink-0 text-muted-foreground/60 hover:text-foreground"
        >
          <Info className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent className="max-w-64 text-wrap">{description}</TooltipContent>
      </Tooltip>
    </span>
  );
}
