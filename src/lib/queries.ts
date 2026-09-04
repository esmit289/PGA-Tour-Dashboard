import { supabase } from "@/lib/supabase";
import type { Player, PlayerSeasonRow, PlayerSeasonStat, StatKey } from "@/lib/types";

export async function getLeaderboard(
  season: number,
  stat: StatKey,
  limit = 50,
  opts?: { search?: string; ascending?: boolean }
) {
  const relation = opts?.search ? "players!inner(*)" : "players(*)";
  let query = supabase
    .from("player_season_stats")
    .select(`*, ${relation}`)
    .eq("season", season)
    .not(stat, "is", null)
    .order(stat, { ascending: opts?.ascending ?? false })
    .limit(limit);

  if (opts?.search) {
    query = query.ilike("players.player_name", `%${opts.search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as unknown as PlayerSeasonRow[];
}

export async function getTourAverages(stat: StatKey) {
  const { data, error } = await supabase
    .from("player_season_stats")
    .select(`season, ${stat}`)
    .not(stat, "is", null);

  if (error) throw error;
  const rows = (data ?? []) as unknown as Record<string, number>[];

  const bySeason = new Map<number, number[]>();
  for (const row of rows) {
    const season = row.season as unknown as number;
    const value = row[stat];
    if (value === null || value === undefined) continue;
    if (!bySeason.has(season)) bySeason.set(season, []);
    bySeason.get(season)!.push(value);
  }

  return Array.from(bySeason.entries())
    .map(([season, values]) => ({
      season,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
    }))
    .sort((a, b) => a.season - b.season);
}

export async function searchPlayers(query: string, limit = 20) {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .ilike("player_name", `%${query}%`)
    .order("player_name")
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as Player[];
}

export async function getPlayer(playerId: string) {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("player_id", playerId)
    .single();

  if (error) throw error;
  return data as Player;
}

export async function getPlayerHistory(playerId: string) {
  const { data, error } = await supabase
    .from("player_season_stats")
    .select("*")
    .eq("player_id", playerId)
    .order("season", { ascending: true });

  if (error) throw error;
  return (data ?? []) as PlayerSeasonStat[];
}

export async function getPlayersForBrowse(limit = 60) {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .order("player_name")
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as Player[];
}

export async function getSeasonSummary(season: number) {
  const { count, error } = await supabase
    .from("player_season_stats")
    .select("*", { count: "exact", head: true })
    .eq("season", season);

  if (error) throw error;
  return { playerCount: count ?? 0 };
}
