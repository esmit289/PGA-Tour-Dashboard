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
  { key: "putts_per_round", label: "Putts Per Round", rankKey: "putts_per_round_rank", format: "decimal2", lowerIsBetter: true },
  { key: "sand_save_pct", label: "Sand Save %", rankKey: "sand_save_rank", format: "pct", lowerIsBetter: false },
  { key: "sg_tee_to_green", label: "SG: Tee-to-Green", rankKey: "sg_tee_to_green_rank", format: "decimal2", lowerIsBetter: false },
  { key: "total_birdies", label: "Total Birdies", rankKey: "total_birdies_rank", format: "int", lowerIsBetter: false },
  { key: "total_eagles", label: "Total Eagles", rankKey: "total_eagles_rank", format: "int", lowerIsBetter: false },
  { key: "birdie_or_better_pct", label: "Birdie or Better %", rankKey: "birdie_or_better_rank", format: "pct", lowerIsBetter: false },
  { key: "bogey_avoidance_pct", label: "Bogey Avoidance (% holes bogeyed)", rankKey: "bogey_avoidance_rank", format: "pct", lowerIsBetter: true },
  { key: "fedexcup_rank", label: "FedExCup Rank", rankKey: "fedexcup_rank", format: "int", lowerIsBetter: true },
  { key: "all_around_rank", label: "All-Around Ranking", rankKey: "all_around_rank", format: "int", lowerIsBetter: true },
] as const;

export type StatKey = (typeof STAT_OPTIONS)[number]["key"];

// Every stat we store, grouped for the player-profile "full season stats" view.
// Unlike STAT_OPTIONS (the sortable subset for the leaderboard/compare pages),
// this covers every column so a season never renders as all blanks just
// because its recorded stat isn't one of the leaderboard's headline picks.
export const PROFILE_STAT_GROUPS: {
  title: string;
  stats: { key: keyof PlayerSeasonStat; label: string; format: string; rankKey?: keyof PlayerSeasonStat }[];
}[] = [
  {
    title: "Scoring",
    stats: [
      { key: "scoring_avg", label: "Scoring Average", format: "decimal3", rankKey: "scoring_avg_rank" },
      { key: "birdie_avg", label: "Birdie Average", format: "decimal2", rankKey: "birdie_avg_rank" },
      { key: "total_birdies", label: "Total Birdies", format: "int", rankKey: "total_birdies_rank" },
      { key: "total_eagles", label: "Total Eagles", format: "int", rankKey: "total_eagles_rank" },
      { key: "birdie_or_better_pct", label: "Birdie or Better %", format: "pct", rankKey: "birdie_or_better_rank" },
      { key: "bogey_avoidance_pct", label: "Bogey Avoidance %", format: "pct", rankKey: "bogey_avoidance_rank" },
    ],
  },
  {
    title: "Off the Tee",
    stats: [
      { key: "driving_distance", label: "Driving Distance", format: "decimal1", rankKey: "driving_distance_rank" },
      { key: "driving_accuracy_pct", label: "Driving Accuracy %", format: "pct", rankKey: "driving_accuracy_rank" },
    ],
  },
  {
    title: "Approach & Around the Green",
    stats: [
      { key: "gir_pct", label: "Greens in Regulation %", format: "pct", rankKey: "gir_rank" },
      { key: "scrambling_pct", label: "Scrambling %", format: "pct", rankKey: "scrambling_rank" },
      { key: "sand_save_pct", label: "Sand Save %", format: "pct", rankKey: "sand_save_rank" },
    ],
  },
  {
    title: "Putting",
    stats: [
      { key: "putting_avg", label: "Putting Average", format: "decimal3", rankKey: "putting_avg_rank" },
      { key: "putts_per_round", label: "Putts Per Round", format: "decimal2", rankKey: "putts_per_round_rank" },
    ],
  },
  {
    title: "Strokes Gained",
    stats: [
      { key: "sg_total", label: "SG: Total", format: "decimal2", rankKey: "sg_total_rank" },
      { key: "sg_tee_to_green", label: "SG: Tee-to-Green", format: "decimal2", rankKey: "sg_tee_to_green_rank" },
      { key: "sg_off_the_tee", label: "SG: Off-the-Tee", format: "decimal2", rankKey: "sg_off_the_tee_rank" },
      { key: "sg_approach", label: "SG: Approach", format: "decimal2", rankKey: "sg_approach_rank" },
      { key: "sg_around_green", label: "SG: Around-the-Green", format: "decimal2", rankKey: "sg_around_green_rank" },
      { key: "sg_putting", label: "SG: Putting", format: "decimal2", rankKey: "sg_putting_rank" },
    ],
  },
  {
    title: "Money & Finishes",
    stats: [
      { key: "official_money", label: "Official Money", format: "money", rankKey: "official_money_rank" },
      { key: "top_10", label: "Top 10 Finishes", format: "int", rankKey: "top_10_rank" },
      { key: "wins", label: "Wins", format: "int", rankKey: "wins_rank" },
      { key: "finish_1st", label: "1st Place Finishes", format: "int" },
      { key: "finish_2nd", label: "2nd Place Finishes", format: "int" },
      { key: "finish_3rd", label: "3rd Place Finishes", format: "int" },
    ],
  },
  {
    title: "Points & Rankings",
    stats: [
      { key: "fedexcup_rank", label: "FedExCup Rank", format: "int" },
      { key: "fedexcup_points", label: "FedExCup Points", format: "decimal1" },
      { key: "fedexcup_wins", label: "FedExCup Wins", format: "int" },
      { key: "fedexcup_top10s", label: "FedExCup Top 10s", format: "int" },
      { key: "world_rank", label: "World Golf Ranking", format: "int" },
      { key: "world_rank_avg_points", label: "World Ranking Avg Points", format: "decimal2" },
      { key: "all_around_rank", label: "All-Around Ranking", format: "int" },
      { key: "all_around_total", label: "All-Around Total", format: "int" },
    ],
  },
];

export const SEASONS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026] as const;
