#!/usr/bin/env python3
"""
Loads scripts/extended_stats_raw/tournament_results.jsonl (individual
tournament-level results -- position, to-par, winnings, and per-event
strokes-gained splits -- see fetch_tournament_results.py) into a new
player_tournament_results table in Supabase.

Separate from player_season_stats: this is one row per (player, single
tournament) rather than one row per (player, season).

Currently only has rows for the players fetch_tournament_results.py was
run for (Rory McIlroy, as a one-player design experiment). Re-run the
fetch script with a longer PLAYER_IDS list and re-run this loader to
add more players -- it does not delete existing rows for other players.

Usage:
    export SUPABASE_DB_URL="postgresql://...supabase.com:5432/postgres"
    python3 scripts/load_tournament_results.py

Run this in your own terminal -- the connection string should never be
pasted into chat.
"""
import io
import json
import os
import sys

import psycopg2

IN_PATH = os.path.join(os.path.dirname(__file__), "extended_stats_raw", "tournament_results.jsonl")

CREATE_SQL = """
create table if not exists player_tournament_results (
    player_id text not null references players(player_id),
    tournament_id text not null,
    tournament_name text not null,
    course_name text,
    season int not null,
    event_date date,
    position text,
    position_numeric int,
    to_par int,
    winnings numeric,
    sg_off_the_tee numeric,
    sg_approach numeric,
    sg_around_green numeric,
    sg_putting numeric,
    primary key (player_id, tournament_id)
);

create index if not exists idx_player_tournament_results_player
    on player_tournament_results(player_id);

alter table player_tournament_results enable row level security;

drop policy if exists "public read player_tournament_results" on player_tournament_results;
create policy "public read player_tournament_results" on player_tournament_results
    for select using (true);
"""

COLUMNS = [
    "player_id",
    "tournament_id",
    "tournament_name",
    "course_name",
    "season",
    "event_date",
    "position",
    "position_numeric",
    "to_par",
    "winnings",
    "sg_off_the_tee",
    "sg_approach",
    "sg_around_green",
    "sg_putting",
]


def esc(value):
    if value is None:
        return "\\N"
    s = str(value)
    return s.replace("\\", "\\\\").replace("\t", " ").replace("\n", " ")


def main():
    db_url = os.environ.get("SUPABASE_DB_URL")
    if not db_url:
        sys.exit(
            "SUPABASE_DB_URL is not set.\n"
            'export SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"\n'
            "then re-run this script."
        )

    if not os.path.exists(IN_PATH):
        sys.exit(f"Missing {IN_PATH} -- run fetch_tournament_results.py first.")

    print(f"Reading {IN_PATH} ...")
    buf = io.StringIO()
    n = 0
    player_ids = set()
    with open(IN_PATH) as f:
        for line in f:
            r = json.loads(line)
            player_ids.add(r["player_id"])
            buf.write("\t".join(esc(r[c]) for c in COLUMNS) + "\n")
            n += 1
    print(f"  {n} tournament-result rows for {len(player_ids)} player(s) prepared")
    buf.seek(0)

    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    try:
        with conn.cursor() as cur:
            print("Ensuring player_tournament_results table exists ...")
            cur.execute(CREATE_SQL)

            print("Clearing existing rows for these player(s) ...")
            cur.execute(
                "delete from player_tournament_results where player_id = any(%s)",
                (list(player_ids),),
            )

            print("Loading rows via COPY ...")
            cur.copy_expert(
                f"copy player_tournament_results ({', '.join(COLUMNS)}) from stdin with (format text)",
                buf,
            )
        conn.commit()
        print(f"Done. Loaded {n} tournament-result rows into player_tournament_results.")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
