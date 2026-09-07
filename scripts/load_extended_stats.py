#!/usr/bin/env python3
"""
Loads scripts/extended_stats_raw/extended_stats_enriched.jsonl (72 curated
PGA Tour stat categories x 11 seasons, pre-fetched from PGA Tour's public
GraphQL API and pre-filtered to our ~400 kept players) into a new
`player_extended_stats` table in Supabase.

Stored as a normalized "long" table (season, player_id, stat_key,
stat_name -> value) rather than one column per stat, since many
categories return several sub-metrics per player (e.g. Driving Distance
returns Avg / Total Distance / Total Drives) and 72 categories would
otherwise mean hundreds of sparse columns.

Raw values are kept as-is in stat_value (e.g. "33' 11\"", "42.33%",
"$1,234,567") plus a best-effort parsed numeric_value for sorting/charting.

Usage:
    export SUPABASE_DB_URL="postgresql://...supabase.com:5432/postgres"
    python3 scripts/load_extended_stats.py

Run this in your own terminal -- the connection string should never be
pasted into chat.
"""
import io
import json
import os
import re
import sys

import psycopg2

IN_PATH = os.path.join(
    os.path.dirname(__file__), "extended_stats_raw", "extended_stats_enriched.jsonl"
)

CREATE_SQL = """
drop table if exists player_extended_stats;

create table player_extended_stats (
    season int not null,
    player_id text not null references players(player_id),
    stat_key text not null,
    stat_category text,
    stat_title text,
    stat_name text not null,
    stat_value text,
    numeric_value numeric,
    rank int,
    primary key (season, player_id, stat_key, stat_name)
);

create index idx_pes_player on player_extended_stats(player_id);
create index idx_pes_season_stat on player_extended_stats(season, stat_key);
create index idx_pes_category on player_extended_stats(stat_category);

alter table player_extended_stats enable row level security;
create policy "public read player_extended_stats" on player_extended_stats for select using (true);
"""

FEET_INCHES_RE = re.compile(r"""^(\d+)'\s*(\d+(?:\.\d+)?)"?$""")


def parse_numeric(raw):
    if raw is None:
        return None
    s = raw.strip()
    if s in ("", "-", "N/A"):
        return None

    m = FEET_INCHES_RE.match(s)
    if m:
        feet, inches = m.groups()
        return round(float(feet) + float(inches) / 12, 4)

    cleaned = s.replace("$", "").replace("%", "").replace(",", "").replace('"', "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return None


def main():
    db_url = os.environ.get("SUPABASE_DB_URL")
    if not db_url:
        sys.exit(
            "SUPABASE_DB_URL is not set.\n"
            'export SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"\n'
            "then re-run this script."
        )

    if not os.path.exists(IN_PATH):
        sys.exit(f"Missing {IN_PATH} -- run fetch_extended_stats.py first.")

    print(f"Reading {IN_PATH} ...")
    buf = io.StringIO()
    n = 0
    seen = set()
    with open(IN_PATH) as f:
        for line in f:
            r = json.loads(line)
            key = (r["season"], r["player_id"], r["stat_key"], r["stat_name"])
            if key in seen:
                continue
            seen.add(key)
            numeric_value = parse_numeric(r.get("stat_value"))
            row = [
                str(r["season"]),
                r["player_id"],
                r["stat_key"],
                r.get("stat_category") or "",
                r.get("stat_title") or "",
                r["stat_name"],
                (r.get("stat_value") or "").replace("\n", " "),
                "" if numeric_value is None else str(numeric_value),
                "" if r.get("rank") is None else str(r["rank"]),
            ]
            # Postgres COPY text format: only backslash/tab/newline need
            # escaping -- unlike CSV format, literal quote characters
            # (e.g. the `"` in a 33' 11" proximity value) are NOT special.
            escaped = [
                f.replace("\\", "\\\\").replace("\t", " ").replace("\n", " ").replace("\r", " ")
                for f in row
            ]
            buf.write("\t".join(escaped) + "\n")
            n += 1
    print(f"  {n} unique rows prepared")
    buf.seek(0)

    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    try:
        with conn.cursor() as cur:
            print("Creating player_extended_stats table ...")
            cur.execute(CREATE_SQL)

            print("Loading rows via COPY ...")
            cur.copy_expert(
                """
                copy player_extended_stats
                (season, player_id, stat_key, stat_category, stat_title, stat_name, stat_value, numeric_value, rank)
                from stdin with (format text, null '')
                """,
                buf,
            )
        conn.commit()
        print(f"Done. Loaded {n} rows into player_extended_stats.")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
