"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { headshotUrl, initials } from "@/lib/format";
import type { Player } from "@/lib/types";

const MAX_SUGGESTIONS = 8;

export function PlayerSearchBox({
  players,
  defaultValue,
}: {
  players: Player[];
  defaultValue: string;
}) {
  const [query, setQuery] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const trimmed = query.trim().toLowerCase();
  const matches = trimmed
    ? players.filter((p) => p.player_name.toLowerCase().includes(trimmed)).slice(0, MAX_SUGGESTIONS)
    : [];

  return (
    <div ref={containerRef} className="relative max-w-sm">
      <form action="/players">
        <Input
          name="q"
          placeholder="Search by name..."
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        />
        {open && trimmed && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border/60 bg-popover shadow-md">
            {matches.length > 0 ? (
              matches.map((p) => (
                <Link
                  key={p.player_id}
                  href={`/players/${p.player_id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary"
                  onClick={() => setOpen(false)}
                >
                  <Avatar className="size-6">
                    <AvatarImage src={headshotUrl(p.player_id)} alt={p.player_name} />
                    <AvatarFallback className="text-[10px]">{initials(p.player_name)}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate">{p.player_name}</span>
                  {p.country && (
                    <span className="text-xs text-muted-foreground">{p.country}</span>
                  )}
                </Link>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">No players found.</p>
            )}
            <button
              type="submit"
              className="w-full border-t border-border/60 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-secondary"
            >
              Search all results for &ldquo;{query}&rdquo;
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
