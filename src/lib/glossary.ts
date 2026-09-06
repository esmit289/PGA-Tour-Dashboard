import type { PlayerSeasonStat } from "@/lib/types";

export const STAT_DESCRIPTIONS: Partial<Record<keyof PlayerSeasonStat, string>> = {
  scoring_avg:
    "Average strokes taken per round, adjusted for course difficulty. Like golf itself, lower is better — think of it as the opposite of a batting average.",
  birdie_avg: "Average number of birdies (one shot under par) made per round.",
  total_birdies: "Total birdies made across the whole season.",
  total_eagles:
    "Total eagles (two shots under par on a single hole) made across the season — a rare, exciting feat.",
  birdie_or_better_pct: "The percentage of holes played where the player made a birdie or better.",
  bogey_avoidance_pct:
    "The percentage of holes played where the player made a bogey (one shot over par) or worse. Lower is better — it rewards avoiding big mistakes.",
  driving_distance: "Average tee-shot distance on par-4s and par-5s, in yards.",
  driving_accuracy_pct:
    "Percentage of tee shots that land in the fairway, instead of the rough, trees, or a hazard.",
  gir_pct:
    "Greens in Regulation — the percentage of holes where the green is reached in the 'expected' number of shots (2 shots on a par 4, etc.), leaving just a putt for par or better.",
  scrambling_pct:
    "When a player misses the green, this is how often they still make par or better anyway. It measures short-game recovery skill.",
  sand_save_pct:
    "Of the times a ball lands in a bunker near the green, the percentage where the player still makes par or better.",
  putting_avg: "Average putts taken per hole where the green was reached in regulation. Lower is better.",
  putts_per_round: "Average total putts taken across a full 18-hole round, however the player got to the green.",
  sg_total:
    "Strokes Gained: Total — the single best measure of overall play. It compares a player's score to the field average that round and expresses the gap in strokes. +2.0 means they played 2 strokes better than an average field.",
  sg_tee_to_green:
    "Strokes gained on everything except putting — tee shots, approach shots, and shots around the green, combined.",
  sg_off_the_tee: "Strokes gained specifically off the tee on par-4s and par-5s — a mix of distance and accuracy.",
  sg_approach: "Strokes gained on approach shots hit toward the green from the fairway or rough.",
  sg_around_green:
    "Strokes gained on short-game shots within roughly 30 yards of the green (chips, pitches, etc.), not counting putts.",
  sg_putting: "Strokes gained on the putting green alone.",
  top_10: "Number of tournaments the player finished in the top 10.",
  finish_1st: "Number of tournaments the player finished in 1st place (a subset of Top 10 Finishes).",
  finish_2nd: "Number of tournaments the player finished in 2nd place (a subset of Top 10 Finishes).",
  finish_3rd: "Number of tournaments the player finished in 3rd place (a subset of Top 10 Finishes).",
  wins: "Number of tournaments the player won outright that season.",
  official_money: "Total prize money earned from official PGA Tour events that season.",
  fedexcup_rank:
    "Position in the FedExCup standings — a season-long points race, like a championship leaderboard, that determines who reaches the Tour's postseason and its bonus pool.",
  fedexcup_points: "Points earned toward the season-long FedExCup standings — bigger events and better finishes earn more.",
  fedexcup_wins: "Wins counted toward the FedExCup season, which can differ slightly from total Tour wins.",
  fedexcup_top10s: "Top-10 finishes counted toward the FedExCup season.",
  world_rank:
    "Official World Golf Ranking — a player's rank among ALL professional golfers worldwide (not just the PGA Tour), based on performance over a rolling two-year window.",
  world_rank_avg_points: "The average points-per-event used to calculate a player's Official World Golf Ranking.",
  all_around_rank:
    "A combined ranking across many statistical categories at once, rewarding players who are strong all-around rather than elite in just one area.",
  all_around_total: "The composite score behind the All-Around Ranking — lower reflects a stronger all-around season.",
};

export const GLOSSARY_INTRO = [
  {
    term: "Strokes Gained",
    body: "The modern standard for measuring skill in golf. Instead of just counting shots, it compares a player's result on every single shot to a massive database of how the average pro performs from that exact same spot. A positive number means they gained strokes on the field (played better than average); negative means they lost strokes. It's the closest thing golf has to an all-in-one performance score.",
  },
  {
    term: "FedExCup",
    body: "The PGA Tour's season-long championship race. Every player earns points based on how they finish in each event, and the standings determine which players advance to the Tour's playoffs and who wins a large postseason bonus.",
  },
  {
    term: "Official World Golf Ranking (OWGR)",
    body: "A ranking of every notable professional golfer on Earth — not just PGA Tour members — based on results over the past two years. It's used to decide who gets into major championships and other elite events.",
  },
  {
    term: "Par, Birdie, Eagle, Bogey",
    body: "Par is the number of strokes an expert golfer is expected to need on a hole. A birdie is one shot better than par, an eagle is two shots better, and a bogey is one shot worse. Lower scores are always better in golf.",
  },
];
