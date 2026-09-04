"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { SEASONS, STAT_OPTIONS } from "@/lib/types";

export function LeaderboardFilters({
  season,
  stat,
  search,
}: {
  season: number;
  stat: string;
  search: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function updateParamDebounced(key: string, value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParam(key, value), 300);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Select value={String(season)} onValueChange={(v) => updateParam("season", v)}>
        <SelectTrigger className="w-full sm:w-32">
          <SelectValue placeholder="Season" />
        </SelectTrigger>
        <SelectContent>
          {[...SEASONS].reverse().map((s) => (
            <SelectItem key={s} value={String(s)}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={stat} onValueChange={(v) => updateParam("stat", v)}>
        <SelectTrigger className="w-full sm:w-64">
          <SelectValue placeholder="Stat" />
        </SelectTrigger>
        <SelectContent>
          {STAT_OPTIONS.map((opt) => (
            <SelectItem key={opt.key} value={opt.key}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="Search player..."
        defaultValue={search}
        className="w-full sm:w-56"
        onChange={(e) => updateParamDebounced("q", e.target.value)}
      />
    </div>
  );
}
