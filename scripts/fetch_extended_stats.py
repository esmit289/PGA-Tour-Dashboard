#!/usr/bin/env python3
"""
Pulls a curated set of additional PGA Tour stat categories (beyond the
original 25 core ones already in player_season_stats) directly from
PGA Tour's own public GraphQL API, for every season 2016-2026, filtered
down to the ~400 players currently kept in our Supabase `players` table.

API discovered by inspecting pgatour.com/stats/detail/<statId>?year=<year>'s
embedded __NEXT_DATA__ / React Query state, which references:
  endpoint: https://orchestrator.pgatour.com/graphql
  apiKey:   da2-gsrx5bibzbb4njvhl7t37wqyl4  (public client key, shipped
            in PGA Tour's own site JS bundle for anyone loading the page)

Output: writes one row per (season, player_id, stat_id, stat_name) to
scripts/extended_stats_raw/extended_stats.jsonl -- a normalized "long"
format, since many categories return multiple sub-metrics per player
(e.g. Driving Distance returns Avg / Total Distance / Total Drives).

This script only reads from PGA Tour's public API and Supabase's public
read-only REST endpoint -- no credentials needed, safe to run anywhere.
"""
import json
import time
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

ORCHESTRATOR_URL = "https://orchestrator.pgatour.com/graphql"
ORCHESTRATOR_API_KEY = "da2-gsrx5bibzbb4njvhl7t37wqyl4"

SUPABASE_URL = "https://clbdjrnvtqvzgcnetqfx.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_DVuVnzIpFOD7gCTqWT1JKw_mLcQjSp5"

SEASONS = list(range(2016, 2027))

# Curated categories beyond the 25 core stats already loaded.
# key -> (statId, human label, category group)
EXTENDED_STATS = {
    # Scoring detail
    "par3_scoring_avg": ("142", "Par 3 Scoring Average", "Scoring"),
    "par4_scoring_avg": ("143", "Par 4 Scoring Average", "Scoring"),
    "par5_scoring_avg": ("144", "Par 5 Scoring Average", "Scoring"),
    "scoring_avg_actual": ("108", "Scoring Average (Actual)", "Scoring"),
    "scoring_avg_before_cut": ("116", "Scoring Average Before Cut", "Scoring"),
    "final_round_scoring_avg": ("118", "Final Round Scoring Average", "Scoring"),
    "bounce_back": ("160", "Bounce Back", "Scoring"),
    "consecutive_cuts": ("122", "Consecutive Cuts", "Scoring"),
    "rounds_in_60s": ("152", "Rounds in the 60s", "Scoring"),
    "sub_par_rounds": ("153", "Sub-Par Rounds", "Scoring"),
    "lowest_round": ("299", "Lowest Round", "Scoring"),
    "bogey_average": ("02419", "Bogey Average", "Scoring"),
    "birdie_to_bogey_ratio": ("02415", "Birdie to Bogey Ratio", "Scoring"),
    # Off the tee
    "total_driving": ("129", "Total Driving", "Off the Tee"),
    "longest_drives": ("159", "Longest Drives", "Off the Tee"),
    "driving_pct_300_plus": ("214", "Driving Pct. 300+ (All Drives)", "Off the Tee"),
    "left_tendency": ("02422", "Left Tendency", "Off the Tee"),
    "right_tendency": ("02423", "Right Tendency", "Off the Tee"),
    # Approach precision by distance
    "approach_50_75": ("076", "Approaches from 50-75 yards", "Approach"),
    "approach_75_100": ("075", "Approaches from 75-100 yards", "Approach"),
    "approach_100_125": ("074", "Approaches from 100-125 yards", "Approach"),
    "approach_125_150": ("339", "Approaches from 125-150 yards", "Approach"),
    "approach_150_175": ("338", "Approaches from 150-175 yards", "Approach"),
    "approach_175_200": ("337", "Approaches from 175-200 yards", "Approach"),
    "approach_200_plus": ("336", "Approaches from > 200 yards", "Approach"),
    "proximity_to_hole": ("331", "Proximity to Hole", "Approach"),
    "proximity_arg": ("374", "Proximity to Hole (Around the Green)", "Approach"),
    "proximity_rough": ("376", "Proximity to Hole from Rough", "Approach"),
    "proximity_sand": ("375", "Proximity to Hole from Sand", "Approach"),
    "proximity_fringe": ("377", "Proximity to Hole from Fringe", "Approach"),
    "going_for_the_green": ("419", "Going for the Green", "Approach"),
    "going_for_green_birdie_or_better": ("02357", "Going for the Green - Birdie or Better", "Approach"),
    # Around the green
    "scrambling_rough": ("363", "Scrambling from the Rough", "Around the Green"),
    "scrambling_sand": ("362", "Scrambling from the Sand", "Around the Green"),
    "scrambling_fringe": ("364", "Scrambling from the Fringe", "Around the Green"),
    "scrambling_other": ("365", "Scrambling from Other Locations", "Around the Green"),
    # Putting
    "one_putt_pct": ("413", "One-Putt Percentage", "Putting"),
    "three_putt_avoidance": ("426", "3-Putt Avoidance", "Putting"),
    "putting_from_3ft": ("341", "Putting from 3'", "Putting"),
    "putting_from_5ft": ("343", "Putting from 5'", "Putting"),
    "putting_inside_5ft": ("403", "Putting from Inside 5'", "Putting"),
    "putting_from_10ft": ("348", "Putting from 10'", "Putting"),
    "putting_from_25plus": ("408", "Putting from > 25'", "Putting"),
    "putts_made_over_10ft_per_event": ("434", "Putts Made Per Event Over 10'", "Putting"),
    "putts_made_over_20ft_per_event": ("435", "Putts Made Per Event Over 20'", "Putting"),
    # Composite ratings
    "power_rating": ("085", "Power Rating", "Ratings"),
    "accuracy_rating": ("086", "Accuracy Rating", "Ratings"),
    "short_game_rating": ("087", "Short Game Rating", "Ratings"),
    "putting_rating": ("088", "Putting Rating", "Ratings"),
    "ball_striking": ("158", "Ball Striking", "Ratings"),
    "scoring_rating": ("02346", "Scoring Rating", "Ratings"),
    # Team / majors points
    "ryder_cup_points": ("131", "Ryder Cup Points", "Team & Majors"),
    "presidents_cup_points_us": ("140", "Presidents Cup Points (United States)", "Team & Majors"),
    "presidents_cup_points_intl": ("187", "Presidents Cup Points (International)", "Team & Majors"),
    # Streaks / fun facts
    "consecutive_birdies_streak": ("02672", "Consecutive Birdies Streak", "Streaks"),
    "best_60s_streak": ("474", "Best Rounds in 60's Streak", "Streaks"),
    "current_par_or_better_streak": ("150", "Current Par or Better Streak", "Streaks"),
    # Recent form (rolling 15-event composite indices)
    "last15_scoring": ("02356", "Last 15 Events - Scoring", "Recent Form"),
    "last15_power": ("02352", "Last 15 Events - Power", "Recent Form"),
    "last15_accuracy": ("02353", "Last 15 Events - Accuracy", "Recent Form"),
    "last15_short_game": ("02354", "Last 15 Events - Short Game", "Recent Form"),
    "last15_putting": ("02355", "Last 15 Events - Putting", "Recent Form"),
    # Modern swing/ball-flight metrics (TrackMan-style)
    "club_head_speed": ("02401", "Club Head Speed", "Swing Metrics"),
    "ball_speed": ("02402", "Ball Speed", "Swing Metrics"),
    "smash_factor": ("02403", "Smash Factor", "Swing Metrics"),
    "launch_angle": ("02404", "Launch Angle", "Swing Metrics"),
    "spin_rate": ("02405", "Spin Rate", "Swing Metrics"),
    "apex_height": ("02407", "Apex Height", "Swing Metrics"),
    "hang_time": ("02408", "Hang Time", "Swing Metrics"),
    "carry_distance": ("02409", "Carry Distance", "Swing Metrics"),
    "total_distance_efficiency": ("02411", "Total Distance Efficiency", "Swing Metrics"),
    "total_driving_efficiency": ("02412", "Total Driving Efficiency", "Swing Metrics"),
}

STAT_DETAILS_QUERY = """
query StatDetails($tourCode: TourCode!, $statId: String!, $year: Int, $eventQuery: StatDetailEventQuery) {
  statDetails(tourCode: $tourCode, statId: $statId, year: $year, eventQuery: $eventQuery) {
    statId
    statTitle
    year
    rows {
      ... on StatDetailsPlayer {
        playerId
        playerName
        rank
        stats {
          statName
          statValue
        }
      }
    }
  }
}
"""


def get_keep_player_ids():
    ids = set()
    offset = 0
    page = 1000
    while True:
        url = f"{SUPABASE_URL}/rest/v1/players?select=player_id&offset={offset}&limit={page}"
        req = urllib.request.Request(
            url,
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            },
        )
        data = json.loads(urllib.request.urlopen(req, timeout=20).read())
        ids.update(row["player_id"] for row in data)
        if len(data) < page:
            break
        offset += page
    return ids


def fetch_stat(stat_key, stat_id, year, retries=3):
    payload = {
        "operationName": "StatDetails",
        "query": STAT_DETAILS_QUERY,
        "variables": {"tourCode": "R", "statId": stat_id, "year": year, "eventQuery": None},
    }
    req = urllib.request.Request(
        ORCHESTRATOR_URL,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "x-api-key": ORCHESTRATOR_API_KEY},
        method="POST",
    )
    for attempt in range(retries):
        try:
            resp = urllib.request.urlopen(req, timeout=25)
            data = json.loads(resp.read())
            details = (data.get("data") or {}).get("statDetails")
            if details is None:
                return stat_key, year, []
            return stat_key, year, details.get("rows") or []
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
            if attempt == retries - 1:
                print(f"  FAILED {stat_key} {year}: {e}")
                return stat_key, year, None
            time.sleep(1.5 * (attempt + 1))


def main():
    print("Fetching keep-list of player IDs from Supabase...")
    keep_ids = get_keep_player_ids()
    print(f"  {len(keep_ids)} players to match against")

    jobs = [
        (stat_key, stat_id, year)
        for stat_key, (stat_id, _, _) in EXTENDED_STATS.items()
        for year in SEASONS
    ]
    print(f"Fetching {len(jobs)} (stat, year) combinations...")

    out_path = "scripts/extended_stats_raw/extended_stats.jsonl"
    written = 0
    failed = []

    with open(out_path, "w") as out, ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(fetch_stat, sk, sid, yr): (sk, yr) for sk, sid, yr in jobs}
        done = 0
        for fut in as_completed(futures):
            stat_key, year, rows = fut.result()
            done += 1
            if done % 50 == 0:
                print(f"  {done}/{len(jobs)} fetched...")
            if rows is None:
                failed.append((stat_key, year))
                continue
            for row in rows:
                pid = row.get("playerId")
                if pid not in keep_ids:
                    continue
                for s in row.get("stats", []):
                    out.write(
                        json.dumps(
                            {
                                "season": year,
                                "player_id": pid,
                                "stat_key": stat_key,
                                "stat_name": s.get("statName"),
                                "stat_value": s.get("statValue"),
                                "rank": row.get("rank"),
                            }
                        )
                        + "\n"
                    )
                    written += 1

    print(f"Done. Wrote {written} rows to {out_path}")
    if failed:
        print(f"{len(failed)} (stat, year) combos failed after retries:")
        for sk, yr in failed:
            print(f"  {sk} {yr}")


if __name__ == "__main__":
    main()
