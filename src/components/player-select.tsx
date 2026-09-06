"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Player } from "@/lib/types";

export function PlayerSelect({
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramKey, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="w-full sm:w-72">
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={currentId ?? undefined} onValueChange={handleChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose a player..." />
        </SelectTrigger>
        <SelectContent>
          {players.map((p) => (
            <SelectItem key={p.player_id} value={p.player_id}>
              {p.player_name}
              {p.country ? ` — ${p.country}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
