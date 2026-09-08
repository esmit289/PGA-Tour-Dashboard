#!/usr/bin/env python3
"""
Pulls each kept player's full-career totals from PGA Tour's own website:
seasons actually played on the PGA TOUR, and career (all-time) official
money. Both numbers cover a player's whole career, not just 2016-2026,
which is what player_season_stats is limited to.

Two page fetches per player, both using the same __NEXT_DATA__
reverse-engineering technique as fetch_player_wins.py (only the numeric
player ID matters in the URL, slug is cosmetic):

  - The "Career" tab's playerProfileCareer query has an "Achievements"
    section with a widget titled "Earnings" -> "Official Money", which
    is the career (all-time) total, e.g. "$130,390,661".

  - The "Results" tab's playerProfileResults query has a "Season" filter
    pill whose options list is the exact list of individual PGA TOUR
    seasons the player has results for (verified against Jim Furyk:
    34 seasons with real gaps like missing 1989/1992/1997 -- this is
    the actual season list, not a derived/approximated range).

Output: scripts/extended_stats_raw/career_totals.jsonl, one row per
player: {player_id, seasons_on_tour, career_official_money}. A player
missing either figure just gets that field as null -- the loader keeps
whatever it can get, and the app falls back to computing from
player_season_stats when a value is missing.

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

NEXT_DATA_RE = re.compile(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', re.S)
MONEY_RE = re.compile(r"[^0-9]")

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


def fetch_next_data(url, retries=3):
    req = urllib.request.Request(url, headers=HEADERS)
    for attempt in range(retries):
        try:
            resp = urllib.request.urlopen(req, timeout=25)
            html = resp.read().decode("utf-8", errors="replace")
            m = NEXT_DATA_RE.search(html)
            if not m:
                return None
            return json.loads(m.group(1))
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError):
            if attempt == retries - 1:
                raise
            time.sleep(1.5 * (attempt + 1))
    return None


def extract_career_money(data):
    try:
        queries = data["props"]["pageProps"]["dehydratedState"]["queries"]
    except (KeyError, TypeError):
        return None
    for q in queries:
        if q["queryKey"][0] != "playerProfileCareer":
            continue
        career = q["state"]["data"].get("career") or []
        for tour in career:
            if tour.get("tourName") != "PGA TOUR":
                continue
            for section in tour.get("careerData", []):
                if section.get("title") != "Achievements":
                    continue
                for stat in section.get("stats", []):
                    if stat.get("title") != "Earnings":
                        continue
                    for entry in stat.get("data", []):
                        if entry.get("label") == "Official Money":
                            digits = MONEY_RE.sub("", entry.get("data") or "")
                            return int(digits) if digits else None
    return None


def extract_seasons_on_tour(data):
    try:
        queries = data["props"]["pageProps"]["dehydratedState"]["queries"]
    except (KeyError, TypeError):
        return None
    for q in queries:
        if q["queryKey"][0] != "playerProfileResults" or len(q["queryKey"]) != 4:
            continue
        d = q["state"]["data"]
        if not d:
            continue
        for pill in d.get("resultPills", []):
            if pill.get("label") != "Season":
                continue
            seasons = {
                o["value"]
                for o in pill.get("options", [])
                if o.get("value") and o["value"] != "career" and o["value"].isdigit()
            }
            return len(seasons) if seasons else None
    return None


def fetch_player_totals(player_id):
    try:
        # PGA Tour's site expects 5-digit zero-padded IDs; shorter legacy
        # IDs (Tiger Woods = "8793", etc.) otherwise resolve to a blank
        # profile with no career/bio data at all.
        padded = player_id.zfill(5)
        career_data = fetch_next_data(f"https://www.pgatour.com/player/{padded}/x/career")
        results_data = fetch_next_data(f"https://www.pgatour.com/player/{padded}/x/results")
        money = extract_career_money(career_data) if career_data else None
        seasons = extract_seasons_on_tour(results_data) if results_data else None
        return player_id, seasons, money, None
    except Exception as e:  # noqa: BLE001 -- log and keep going, one player shouldn't kill the run
        return player_id, None, None, str(e)


def main():
    print("Fetching keep-list of player IDs from Supabase...")
    player_ids = get_keep_player_ids()
    print(f"  {len(player_ids)} players to fetch")

    out_path = "scripts/extended_stats_raw/career_totals.jsonl"
    failed = []
    written = 0

    with open(out_path, "w") as out, ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(fetch_player_totals, pid): pid for pid in player_ids}
        done = 0
        for fut in as_completed(futures):
            player_id, seasons, money, err = fut.result()
            done += 1
            if done % 25 == 0:
                print(f"  {done}/{len(player_ids)} fetched...")
            if err:
                failed.append((player_id, err))
                continue
            out.write(
                json.dumps(
                    {
                        "player_id": player_id,
                        "seasons_on_tour": seasons,
                        "career_official_money": money,
                    }
                )
                + "\n"
            )
            written += 1

    print(f"Done. Wrote {written} rows to {out_path}")
    if failed:
        print(f"{len(failed)} players failed after retries:")
        for pid, err in failed:
            print(f"  {pid}: {err}")


if __name__ == "__main__":
    main()
