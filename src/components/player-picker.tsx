"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import type { Player } from "@/lib/types";

export function PlayerPicker({
  paramKey,
  label,
  currentName,
}: {
  paramKey: string;
  label: string;
  currentName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Player[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      const res = await fetch(`/api/players/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      setResults(json.players ?? []);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function select(player: Player) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramKey, player.player_id);
    router.push(`${pathname}?${params.toString()}`);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="relative w-full sm:w-72">
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <Input
        placeholder={currentName ?? "Search player..."}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md">
          {results.map((p) => (
            <li key={p.player_id}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-secondary"
                onMouseDown={() => select(p)}
              >
                {p.player_name}
                {p.country && (
                  <span className="ml-2 text-xs text-muted-foreground">{p.country}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
