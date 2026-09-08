#!/usr/bin/env python3
"""
Pulls each kept player's individual PGA TOUR win history (season +
tournament name) from PGA Tour's own website, for the "Wins" dropdown
on player profile pages.

There's no lightweight GraphQL query for this (unlike stat categories --
see fetch_extended_stats.py) since the "Career" tab's data is composed
server-side by PGA Tour's own Next.js app. Instead this fetches each
player's career page (the URL slug doesn't matter, only the numeric ID
does -- verified by requesting a garbage slug and getting the right
player back) and pulls the "PGA TOUR Wins" table out of the embedded
__NEXT_DATA__ payload, same technique as the stats reverse-engineering.

A player with zero PGA Tour wins simply has no "PGA TOUR Wins" section
in their data at all (verified against a player with only international/
senior-tour wins) -- that's treated as an empty list, not an error.

Output: scripts/extended_stats_raw/player_wins.jsonl (reuses that
directory since it's already gitignored as regeneratable data), one row
per (player_id, season, tournament).

This script only reads from PGA Tour's public website and Supabase's
public read-only REST endpoint -- no credentials needed, safe to run
anywhere.
"""
import json
import re
import time
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

SUPABASE_URL = "https://clbdjrnvtqvzgcnetqfx.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_DVuVnzIpFOD7gCTqWT1JKw_mLcQjSp5"

NEXT_DATA_RE = re.compile(
    r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', re.S
)
WIN_ENTRY_RE = re.compile(r"^(\d{4})\s+(.*)$")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
}


def get_keep_player_ids():
    ids = []
    offset = 0
    page = 1000
    while True:
        url = f"{SUPABASE_URL}/rest/v1/players?select=player_id&order=player_id&offset={offset}&limit={page}"
        req = urllib.request.Request(
            url,
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            },
        )
        data = json.loads(urllib.request.urlopen(req, timeout=20).read())
        ids.extend(row["player_id"] for row in data)
        if len(data) < page:
            break
        offset += page
    return ids


def parse_win_entry(raw):
    m = WIN_ENTRY_RE.match(raw.strip())
    if not m:
        return None
    season = int(m.group(1))
    name = re.sub(r"\s*\*+$", "", m.group(2).strip())
    return season, name


def extract_pga_wins(career_data):
    if not career_data:
        return []
    for tour in career_data:
        if tour.get("tourName") != "PGA TOUR":
            continue
        for section in tour.get("careerData", []):
            if section.get("title") == "PGA TOUR Wins":
                wins = []
                for row in section.get("rows", []):
                    for entry in row.get("data", []):
                        parsed = parse_win_entry(entry)
                        if parsed:
                            wins.append(parsed)
                return wins
    return []


def fetch_player_wins(player_id, retries=3):
    url = f"https://www.pgatour.com/player/{player_id}/x/career"
    req = urllib.request.Request(url, headers=HEADERS)
    for attempt in range(retries):
        try:
            resp = urllib.request.urlopen(req, timeout=25)
            html = resp.read().decode("utf-8", errors="replace")
            m = NEXT_DATA_RE.search(html)
            if not m:
                return player_id, None
            data = json.loads(m.group(1))
            queries = data["props"]["pageProps"]["dehydratedState"]["queries"]
            for q in queries:
                if q["queryKey"][0] == "playerProfileCareer":
                    career = q["state"]["data"].get("career")
                    return player_id, extract_pga_wins(career)
            return player_id, []
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, KeyError) as e:
            if attempt == retries - 1:
                print(f"  FAILED {player_id}: {e}")
                return player_id, None
            time.sleep(1.5 * (attempt + 1))


def main():
    print("Fetching keep-list of player IDs from Supabase...")
    player_ids = get_keep_player_ids()
    print(f"  {len(player_ids)} players to fetch")

    out_path = "scripts/extended_stats_raw/player_wins.jsonl"
    total_wins = 0
    failed = []

    with open(out_path, "w") as out, ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(fetch_player_wins, pid): pid for pid in player_ids}
        done = 0
        for fut in as_completed(futures):
            player_id, wins = fut.result()
            done += 1
            if done % 25 == 0:
                print(f"  {done}/{len(player_ids)} fetched...")
            if wins is None:
                failed.append(player_id)
                continue
            for season, tournament in wins:
                out.write(json.dumps({"player_id": player_id, "season": season, "tournament": tournament}) + "\n")
                total_wins += 1

    print(f"Done. Wrote {total_wins} win records to {out_path}")
    if failed:
        print(f"{len(failed)} players failed after retries: {failed}")


if __name__ == "__main__":
    main()
