export interface Player {
  player_id: string;
  player_name: string;
  country: string | null;
}

export interface PlayerSeasonStat {
  season: number;
  player_id: string;
  scoring_avg_rank: number | null;
  scoring_avg: number | null;
  driving_distance_rank: number | null;
  driving_distance: number | null;
  driving_accuracy_rank: number | null;
  driving_accuracy_pct: number | null;
  gir_rank: number | null;
  gir_pct: number | null;
  putting_avg_rank: number | null;
  putting_avg: number | null;
  putts_per_round_rank: number | null;
  putts_per_round: number | null;
  scrambling_rank: number | null;
  scrambling_pct: number | null;
  sand_save_rank: number | null;
  sand_save_pct: number | null;
  sg_total_rank: number | null;
  sg_total: number | null;
  sg_tee_to_green_rank: number | null;
  sg_tee_to_green: number | null;
  sg_off_the_tee_rank: number | null;
  sg_off_the_tee: number | null;
  sg_approach_rank: number | null;
  sg_approach: number | null;
  sg_around_green_rank: number | null;
  sg_around_green: number | null;
  sg_putting_rank: number | null;
  sg_putting: number | null;
  birdie_avg_rank: number | null;
  birdie_avg: number | null;
  total_birdies_rank: number | null;
  total_birdies: number | null;
  total_eagles_rank: number | null;
  total_eagles: number | null;
  birdie_or_better_rank: number | null;
  birdie_or_better_pct: number | null;
  bogey_avoidance_rank: number | null;
  bogey_avoidance_pct: number | null;
  top_10_rank: number | null;
  top_10: number | null;
  finish_1st: number | null;
  finish_2nd: number | null;
  finish_3rd: number | null;
  wins_rank: number | null;
  wins: number | null;
  official_money_rank: number | null;
  official_money: number | null;
  fedexcup_rank: number | null;
  fedexcup_points: number | null;
  fedexcup_wins: number | null;
  fedexcup_top10s: number | null;
  world_rank: number | null;
  world_rank_avg_points: number | null;
  all_around_rank: number | null;
  all_around_total: number | null;
}

export type PlayerSeasonRow = PlayerSeasonStat & {
  players: Player;
};

export const STAT_OPTIONS = [
  { key: "sg_total", label: "SG: Total", rankKey: "sg_total_rank", format: "decimal2", lowerIsBetter: false },
  { key: "scoring_avg", label: "Scoring Average", rankKey: "scoring_avg_rank", format: "decimal3", lowerIsBetter: true },
  { key: "official_money", label: "Official Money", rankKey: "official_money_rank", format: "money", lowerIsBetter: false },
  { key: "driving_distance", label: "Driving Distance", rankKey: "driving_distance_rank", format: "decimal1", lowerIsBetter: false },
  { key: "driving_accuracy_pct", label: "Driving Accuracy %", rankKey: "driving_accuracy_rank", format: "pct", lowerIsBetter: false },
  { key: "gir_pct", label: "Greens in Regulation %", rankKey: "gir_rank", format: "pct", lowerIsBetter: false },
  { key: "putting_avg", label: "Putting Average", rankKey: "putting_avg_rank", format: "decimal3", lowerIsBetter: true },
  { key: "scrambling_pct", label: "Scrambling %", rankKey: "scrambling_rank", format: "pct", lowerIsBetter: false },
  { key: "sg_off_the_tee", label: "SG: Off-the-Tee", rankKey: "sg_off_the_tee_rank", format: "decimal2", lowerIsBetter: false },
  { key: "sg_approach", label: "SG: Approach", rankKey: "sg_approach_rank", format: "decimal2", lowerIsBetter: false },
  { key: "sg_around_green", label: "SG: Around-the-Green", rankKey: "sg_around_green_rank", format: "decimal2", lowerIsBetter: false },
  { key: "sg_putting", label: "SG: Putting", rankKey: "sg_putting_rank", format: "decimal2", lowerIsBetter: false },
  { key: "birdie_avg", label: "Birdie Average", rankKey: "birdie_avg_rank", format: "decimal2", lowerIsBetter: false },
  { key: "wins", label: "Wins", rankKey: "wins_rank", format: "int", lowerIsBetter: false },
  { key: "top_10", label: "Top 10 Finishes", rankKey: "top_10_rank", format: "int", lowerIsBetter: false },
  { key: "world_rank", label: "World Golf Ranking", rankKey: "world_rank", format: "int", lowerIsBetter: true },
] as const;

export type StatKey = (typeof STAT_OPTIONS)[number]["key"];

export const SEASONS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026] as const;
