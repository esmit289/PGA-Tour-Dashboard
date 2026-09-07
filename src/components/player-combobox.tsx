"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Player } from "@/lib/types";

export function PlayerCombobox({
  paramKey,
  label,
  players,
  currentId,
}: {
  paramKey: string;
  label: string;
  players: Player[];
  currentId?: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = players.find((p) => p.player_id === currentId);

  function handleSelect(playerId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramKey, playerId);
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  return (
    <div className="w-full sm:w-72">
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">
              {current ? current.player_name : "Type or choose a player..."}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0">
          <Command>
            <CommandInput placeholder="Type a player's name..." />
            <CommandList>
              <CommandEmpty>No player found.</CommandEmpty>
              <CommandGroup>
                {players.map((p) => (
                  <CommandItem
                    key={p.player_id}
                    value={p.player_name}
                    data-checked={p.player_id === currentId}
                    onSelect={() => handleSelect(p.player_id)}
                  >
                    {p.player_name}
                    {p.country && (
                      <span className="ml-1.5 text-xs text-muted-foreground">{p.country}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
