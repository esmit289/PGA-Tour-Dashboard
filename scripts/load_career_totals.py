#!/usr/bin/env python3
"""
Loads scripts/extended_stats_raw/career_totals.jsonl (each kept player's
full-career seasons-on-tour count and all-time official money, pulled
from PGA Tour's own site -- see fetch_career_totals.py) into a new
player_career_totals table in Supabase.

Separate from player_season_stats because it holds whole-career totals
rather than a per-season breakdown, and separate from player_wins
because it's one row per player rather than one row per win.

A handful of players (PGA Tour's own site returns blank bio/career data
for some retired legends -- Tiger Woods, Phil Mickelson, Vijay Singh,
Steve Stricker, David Toms, Jerry Kelly, confirmed by fetch_career_totals.py)
have null seasons_on_tour / career_official_money here. The app falls
back to computing from player_season_stats for those.

Usage:
    export SUPABASE_DB_URL="postgresql://...supabase.com:5432/postgres"
    python3 scripts/load_career_totals.py

Run this in your own terminal -- the connection string should never be
pasted into chat.
"""
import io
import json
import os
import sys

import psycopg2

IN_PATH = os.path.join(os.path.dirname(__file__), "extended_stats_raw", "career_totals.jsonl")

CREATE_SQL = """
drop table if exists player_career_totals;

create table player_career_totals (
    player_id text primary key references players(player_id),
    seasons_on_tour int,
    career_official_money bigint
);

alter table player_career_totals enable row level security;
create policy "public read player_career_totals" on player_career_totals for select using (true);
"""


def main():
    db_url = os.environ.get("SUPABASE_DB_URL")
    if not db_url:
        sys.exit(
            "SUPABASE_DB_URL is not set.\n"
            'export SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"\n'
            "then re-run this script."
        )

    if not os.path.exists(IN_PATH):
        sys.exit(f"Missing {IN_PATH} -- run fetch_career_totals.py first.")

    print(f"Reading {IN_PATH} ...")
    buf = io.StringIO()
    n = 0
    with open(IN_PATH) as f:
        for line in f:
            r = json.loads(line)
            seasons = str(r["seasons_on_tour"]) if r["seasons_on_tour"] is not None else "\\N"
            money = str(r["career_official_money"]) if r["career_official_money"] is not None else "\\N"
            buf.write(f"{r['player_id']}\t{seasons}\t{money}\n")
            n += 1
    print(f"  {n} player rows prepared")
    buf.seek(0)

    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    try:
        with conn.cursor() as cur:
            print("Creating player_career_totals table ...")
            cur.execute(CREATE_SQL)

            print("Loading rows via COPY ...")
            cur.copy_expert(
                "copy player_career_totals (player_id, seasons_on_tour, career_official_money) "
                "from stdin with (format text)",
                buf,
            )
        conn.commit()
        print(f"Done. Loaded {n} rows into player_career_totals.")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
