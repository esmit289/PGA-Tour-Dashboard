"use client";

import { cn } from "@/lib/utils";
import type { PlayerTournamentResult } from "@/lib/queries";

const MAX_ABS_TO_PAR = 20;

function barWidthPct(toPar: number) {
  return Math.min(Math.abs(toPar) / MAX_ABS_TO_PAR, 1) * 100;
}

export function TournamentResultsList({ results }: { results: PlayerTournamentResult[] }) {
  // Most recent first -- results already come in ascending event_date order.
  const rows = [...results].reverse();

  return (
    <div className="max-h-[560px] space-y-0.5 overflow-y-auto pr-1">
      {rows.map((r, i) => {
        const showSeason = i === 0 || rows[i - 1].season !== r.season;
        const isWin = r.position_numeric === 1;
        const hasScore = r.to_par !== null;

        return (
          <div key={r.tournament_id} className="flex items-center gap-2 py-1 text-xs">
            <span className="w-10 shrink-0 text-slate-500">{showSeason ? r.season : ""}</span>
            <span className="w-40 shrink-0 truncate text-slate-200" title={r.tournament_name}>
              {r.tournament_name}
            </span>
            <span className="w-8 shrink-0 text-slate-400">{r.position ?? "—"}</span>
            <div className="relative h-3 flex-1 overflow-hidden rounded-sm bg-white/5">
              {hasScore && (
                <div
                  className={cn(
                    "absolute inset-y-0 right-0 rounded-sm",
                    isWin ? "bg-rose-300" : "bg-sky-400/70"
                  )}
                  style={{ width: `${barWidthPct(r.to_par!)}%` }}
                />
              )}
            </div>
            <span className="w-10 shrink-0 text-right text-slate-400">
              {r.to_par === null ? "—" : r.to_par === 0 ? "E" : r.to_par > 0 ? `+${r.to_par}` : r.to_par}
            </span>
          </div>
        );
      })}
    </div>
  );
}
