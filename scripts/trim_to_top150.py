#!/usr/bin/env python3
"""
Trims the players/player_season_stats tables down to players who actually
matter for a "top of the game" PGA Tour dashboard:

  1. Any player who was ranked top 150 in the FedExCup standings in at
     least one season, 2016-2026.
  2. D.J. Trahan (player_id 23788) -- verified 2 career PGA TOUR wins
     (2006 Southern Farm Bureau Classic, 2008 Bob Hope Chrysler Classic),
     both before this dataset's 2016 start, so his FedExCup rank in our
     window alone wouldn't have kept him.

Everyone else is deleted, along with their season-stat rows.

Usage:
    export SUPABASE_DB_URL="postgresql://...supabase.com:5432/postgres"
    python3 scripts/trim_to_top150.py

Run this in your own terminal -- the connection string should never be
pasted into chat.
"""
import os
import sys

import psycopg2

# Verified pre-2016 PGA Tour winners who never cracked the FedExCup top 150
# in our 2016-2026 window, so the fedexcup_rank<=150 rule alone would drop
# them. Add more player_ids here (with a comment noting the verification)
# if you identify others later.
MANUAL_KEEP_IDS = {
    "23788",  # D.J. Trahan -- 2 PGA Tour wins (2006, 2008)
}

SQL = """
create temporary table keep_players as
select distinct player_id from player_season_stats where fedexcup_rank <= 150
union
select unnest(%(manual_ids)s::text[]);

select count(*) from keep_players;
"""


def main():
    db_url = os.environ.get("SUPABASE_DB_URL")
    if not db_url:
        sys.exit(
            "SUPABASE_DB_URL is not set.\n"
            'export SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"\n'
            "then re-run this script."
        )

    conn = psycopg2.connect(db_url)
    conn.autocommit = False
    try:
        with conn.cursor() as cur:
            cur.execute("select count(*) from players")
            before_players = cur.fetchone()[0]
            cur.execute("select count(*) from player_season_stats")
            before_stats = cur.fetchone()[0]
            print(f"Before: {before_players} players, {before_stats} player-seasons")

            cur.execute(SQL, {"manual_ids": list(MANUAL_KEEP_IDS)})
            keep_count = cur.fetchone()[0]
            print(f"Keeping {keep_count} players")

            cur.execute(
                "delete from player_season_stats where player_id not in (select player_id from keep_players)"
            )
            deleted_stats = cur.rowcount
            cur.execute(
                "delete from players where player_id not in (select player_id from keep_players)"
            )
            deleted_players = cur.rowcount

            cur.execute("select count(*) from players")
            after_players = cur.fetchone()[0]
            cur.execute("select count(*) from player_season_stats")
            after_stats = cur.fetchone()[0]

        conn.commit()
        print(f"Deleted {deleted_players} players and {deleted_stats} player-seasons.")
        print(f"After: {after_players} players, {after_stats} player-seasons")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
