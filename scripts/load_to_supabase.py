#!/usr/bin/env python3
"""
Loads pga_tour_stats_2016_2026.csv into Supabase Postgres.

Normalizes the raw 109-column PGA Tour export into two clean tables:
  - players              (player_id, player_name, country)
  - player_season_stats  (season, player_id, ~50 headline stat/rank columns)

Connects directly to Postgres (not the SQL Editor) via psycopg2's COPY
protocol, so there is no query-size limit -- the full 7,521-row CSV loads
in one shot.

Usage:
    pip3 install psycopg2-binary pandas
    export SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
    python3 scripts/load_to_supabase.py

Get SUPABASE_DB_URL from: Supabase dashboard -> Project Settings -> Database
-> Connection string -> URI (use "Direct connection", port 5432).
Run this from your own terminal so the password never appears in chat.
"""
import csv
import io
import os
import sys

import pandas as pd
import psycopg2

CSV_PATH = os.path.join(os.path.dirname(__file__), "pga_tour_stats_2016_2026.csv")

# Maps destination column name -> source CSV column name
STAT_COLUMNS = {
    "scoring_avg_rank": "Scoring Average - Rank",
    "scoring_avg": "Scoring Average - Avg",
    "driving_distance_rank": "Driving Distance - Rank",
    "driving_distance": "Driving Distance - Avg",
    "driving_accuracy_rank": "Driving Accuracy Percentage - Rank",
    "driving_accuracy_pct": "Driving Accuracy Percentage - %",
    "gir_rank": "Greens in Regulation Percentage - Rank",
    "gir_pct": "Greens in Regulation Percentage - %",
    "putting_avg_rank": "Putting Average - Rank",
    "putting_avg": "Putting Average - Avg",
    "putts_per_round_rank": "Putts Per Round - Rank",
    "putts_per_round": "Putts Per Round - Avg",
    "scrambling_rank": "Scrambling - Rank",
    "scrambling_pct": "Scrambling - %",
    "sand_save_rank": "Sand Save Percentage - Rank",
    "sand_save_pct": "Sand Save Percentage - %",
    "sg_total_rank": "SG: Total - Rank",
    "sg_total": "SG: Total - Avg",
    "sg_tee_to_green_rank": "SG: Tee-to-Green - Rank",
    "sg_tee_to_green": "SG: Tee-to-Green - Avg",
    "sg_off_the_tee_rank": "SG: Off-the-Tee - Rank",
    "sg_off_the_tee": "SG: Off-the-Tee - Avg",
    "sg_approach_rank": "SG: Approach the Green - Rank",
    "sg_approach": "SG: Approach the Green - Avg",
    "sg_around_green_rank": "SG: Around-the-Green - Rank",
    "sg_around_green": "SG: Around-the-Green - Avg",
    "sg_putting_rank": "SG: Putting - Rank",
    "sg_putting": "SG: Putting - Avg",
    "birdie_avg_rank": "Birdie Average - Rank",
    "birdie_avg": "Birdie Average - Avg",
    "total_birdies_rank": "Total Birdies - Rank",
    "total_birdies": "Total Birdies - Total",
    "total_eagles_rank": "Total Eagles - Rank",
    "total_eagles": "Total Eagles - Total",
    "birdie_or_better_rank": "Birdie or Better Percentage - Rank",
    "birdie_or_better_pct": "Birdie or Better Percentage - %",
    "bogey_avoidance_rank": "Bogey Avoidance - Rank",
    "bogey_avoidance_pct": "Bogey Avoidance - % Makes Bogey",
    "top_10_rank": "Top 10 Finishes - Rank",
    "top_10": "Top 10 Finishes - Top 10",
    "finish_1st": "Top 10 Finishes - 1st",
    "finish_2nd": "Top 10 Finishes - 2nd",
    "finish_3rd": "Top 10 Finishes - 3rd",
    "wins_rank": "Victory Leaders - Rank",
    "wins": "Victory Leaders - Victories",
    "official_money_rank": "Official Money - Rank",
    "official_money": "Official Money - Money",
    "fedexcup_rank": "FedExCup Standings - Rank",
    "fedexcup_points": "FedExCup Standings - Points",
    "fedexcup_wins": "FedExCup Standings - # of Wins",
    "fedexcup_top10s": "FedExCup Standings - # of Top-10s",
    "world_rank": "Official World Golf Ranking - Rank",
    "world_rank_avg_points": "Official World Golf Ranking - Avg Points",
    "all_around_rank": "All-Around Ranking - Rank",
    "all_around_total": "All-Around Ranking - Total",
}

INT_COLUMNS = {
    "scoring_avg_rank", "driving_distance_rank", "driving_accuracy_rank", "gir_rank",
    "putting_avg_rank", "putts_per_round_rank", "scrambling_rank", "sand_save_rank",
    "sg_total_rank", "sg_tee_to_green_rank", "sg_off_the_tee_rank", "sg_approach_rank",
    "sg_around_green_rank", "sg_putting_rank", "birdie_avg_rank", "total_birdies_rank",
    "total_birdies", "total_eagles_rank", "total_eagles", "birdie_or_better_rank",
    "bogey_avoidance_rank", "top_10_rank", "top_10", "finish_1st", "finish_2nd",
    "finish_3rd", "wins_rank", "wins", "official_money_rank", "fedexcup_rank",
    "fedexcup_wins", "fedexcup_top10s", "world_rank", "all_around_rank",
}

CREATE_SQL = """
drop table if exists player_season_stats;
drop table if exists players;

create table players (
    player_id text primary key,
    player_name text not null,
    country text
);

create table player_season_stats (
    season int not null,
    player_id text not null references players(player_id),
    {stat_cols},
    primary key (season, player_id)
);

create index idx_pss_season on player_season_stats(season);
create index idx_pss_player on player_season_stats(player_id);

alter table players enable row level security;
alter table player_season_stats enable row level security;

create policy "public read players" on players for select using (true);
create policy "public read player_season_stats" on player_season_stats for select using (true);
"""


def build_create_sql():
    lines = []
    for dest in STAT_COLUMNS:
        sql_type = "integer" if dest in INT_COLUMNS else "numeric"
        lines.append(f"    {dest} {sql_type}")
    return CREATE_SQL.format(stat_cols=",\n".join(lines))


def clean_numeric(series: pd.Series) -> pd.Series:
    cleaned = (
        series.astype(str)
        .str.replace(r"[\$,%]", "", regex=True)
        .str.replace(",", "", regex=False)
        .str.strip()
    )
    cleaned = cleaned.replace({"": None, "-": None, "nan": None, "None": None})
    return pd.to_numeric(cleaned, errors="coerce")


def main():
    db_url = os.environ.get("SUPABASE_DB_URL")
    if not db_url:
        sys.exit(
            "SUPABASE_DB_URL is not set.\n"
            'export SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"\n'
            "then re-run this script."
        )

    print(f"Reading {CSV_PATH} ...")
    df = pd.read_csv(CSV_PATH)
    print(f"  {len(df)} rows x {len(df.columns)} columns")

    players = (
        df[["Player ID", "Player Name", "Country"]]
        .drop_duplicates(subset=["Player ID"], keep="last")
        .rename(columns={"Player ID": "player_id", "Player Name": "player_name", "Country": "country"})
    )

    stats = pd.DataFrame()
    stats["season"] = pd.to_numeric(df["Season"], errors="coerce").astype("Int64")
    stats["player_id"] = df["Player ID"]
    for dest, src in STAT_COLUMNS.items():
        stats[dest] = clean_numeric(df[src])
        if dest in INT_COLUMNS:
            stats[dest] = stats[dest].astype("Int64")

    print(f"players: {len(players)} rows")
    print(f"player_season_stats: {len(stats)} rows")

    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    try:
        with conn.cursor() as cur:
            print("Creating tables ...")
            cur.execute(build_create_sql())

            print("Loading players ...")
            buf = io.StringIO()
            players.to_csv(buf, index=False, header=False, na_rep="")
            buf.seek(0)
            cur.copy_expert(
                "COPY players (player_id, player_name, country) FROM STDIN WITH (FORMAT csv, NULL '')",
                buf,
            )

            print("Loading player_season_stats ...")
            buf = io.StringIO()
            stats.to_csv(buf, index=False, header=False, na_rep="")
            buf.seek(0)
            cols = ", ".join(stats.columns)
            cur.copy_expert(
                f"COPY player_season_stats ({cols}) FROM STDIN WITH (FORMAT csv, NULL '')",
                buf,
            )
        conn.commit()
        print("Done. Loaded", len(players), "players and", len(stats), "player-seasons.")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
