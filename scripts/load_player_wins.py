#!/usr/bin/env python3
"""
Loads scripts/extended_stats_raw/player_wins.jsonl (each kept player's
full PGA TOUR win history -- season + tournament name, pulled from PGA
Tour's own career pages, including wins from before 2016) into a new
player_wins table in Supabase.

This is intentionally a separate table from player_season_stats: it's a
list of individual tournament wins, not a per-season aggregate, and it
covers a player's whole career rather than just 2016-2026.

Usage:
    export SUPABASE_DB_URL="postgresql://...supabase.com:5432/postgres"
    python3 scripts/load_player_wins.py

Run this in your own terminal -- the connection string should never be
pasted into chat.
"""
import io
import json
import os
import sys

import psycopg2

IN_PATH = os.path.join(os.path.dirname(__file__), "extended_stats_raw", "player_wins.jsonl")

CREATE_SQL = """
drop table if exists player_wins;

create table player_wins (
    player_id text not null references players(player_id),
    season int not null,
    tournament text not null,
    primary key (player_id, season, tournament)
);

create index idx_player_wins_player on player_wins(player_id);

alter table player_wins enable row level security;
create policy "public read player_wins" on player_wins for select using (true);
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
        sys.exit(f"Missing {IN_PATH} -- run fetch_player_wins.py first.")

    print(f"Reading {IN_PATH} ...")
    buf = io.StringIO()
    n = 0
    seen = set()
    with open(IN_PATH) as f:
        for line in f:
            r = json.loads(line)
            key = (r["player_id"], r["season"], r["tournament"])
            if key in seen:
                continue
            seen.add(key)
            row = [r["player_id"], str(r["season"]), r["tournament"]]
            escaped = [f.replace("\\", "\\\\").replace("\t", " ").replace("\n", " ") for f in row]
            buf.write("\t".join(escaped) + "\n")
            n += 1
    print(f"  {n} unique win records prepared")
    buf.seek(0)

    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    try:
        with conn.cursor() as cur:
            print("Creating player_wins table ...")
            cur.execute(CREATE_SQL)

            print("Loading rows via COPY ...")
            cur.copy_expert(
                "copy player_wins (player_id, season, tournament) from stdin with (format text)",
                buf,
            )
        conn.commit()
        print(f"Done. Loaded {n} win records into player_wins.")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
