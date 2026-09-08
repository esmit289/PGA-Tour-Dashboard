"use client";

import { useState } from "react";
import { Trophy, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { PlayerWin } from "@/lib/queries";

export function WinsDropdown({ wins }: { wins: PlayerWin[] }) {
  const [open, setOpen] = useState(false);

  if (wins.length === 0) return null;

  const bySeason = new Map<number, string[]>();
  for (const w of wins) {
    if (!bySeason.has(w.season)) bySeason.set(w.season, []);
    bySeason.get(w.season)!.push(w.tournament);
  }
  const seasons = [...bySeason.keys()].sort((a, b) => b - a);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 rounded-lg border border-border/60 bg-card px-4 py-3 text-left transition-colors hover:bg-secondary/40"
        >
          <span className="flex items-center gap-2 font-medium">
            <Trophy className="size-4 text-accent" />
            Career Wins ({wins.length})
          </span>
          <ChevronDown
            className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 rounded-lg border border-border/60 bg-card/60 p-4">
        <div className="space-y-3">
          {seasons.map((season) => (
            <div key={season}>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">{season}</p>
              <ul className="space-y-0.5">
                {bySeason.get(season)!.map((tournament, i) => (
                  <li key={i} className="text-sm">
                    {tournament}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
