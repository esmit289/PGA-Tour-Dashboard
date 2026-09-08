#!/usr/bin/env python3
"""
Pulls full individual-tournament results (score to par, finish position,
winnings, and per-tournament strokes-gained splits) for the players in
PLAYER_IDS below -- data for the "Tableau-style" player performance
dashboard experiment.

Two GraphQL queries against PGA Tour's public orchestrator (same
endpoint/API key as fetch_extended_stats.py):

  - playerProfileTournamentResults(playerId, tourCode): returns every
    tournament the player has ever played on the PGA TOUR, grouped by
    tournament name with one row per year played -- position, total
    score, to-par, winnings. One call gets a player's whole career
    (verified against Rory McIlroy: 312 tournaments, 2007-2026).

  - statDetails(tourCode, statId, year, eventQuery: {tournamentId,
    queryType: EVENT_ONLY}): the same query fetch_extended_stats.py
    uses for season-level stats, but scoped to a single event via
    eventQuery. Returns every player's value for that stat at that one
    tournament; we pull the requested player's row. Used once per
    (tournament, SG category) to get that player's per-tournament SG
    splits (Off-the-Tee/Approach/Around-the-Green/Putting) -- data the
    site doesn't expose any other way we've found.

Currently scoped to PLAYER_IDS = ["28237"] (Rory McIlroy) for a
one-player design experiment. To run for the full roster, replace
PLAYER_IDS with get_keep_player_ids() (see fetch_player_wins.py for
the pattern) -- expect ~400x the API calls (roughly 300 tournaments x
4 stat categories per player).

Output: scripts/extended_stats_raw/tournament_results.jsonl, one row
per (player_id, tournament_id).
"""
import json
import re
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

PLAYER_IDS = ["28237"]  # Rory McIlroy -- experiment scope, see docstring

ORCHESTRATOR_URL = "https://orchestrator.pgatour.com/graphql"
API_KEY = "da2-gsrx5bibzbb4njvhl7t37wqyl4"
HEADERS = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36",
}

SG_CATEGORIES = {
    "sg_off_the_tee": "02567",
    "sg_approach": "02568",
    "sg_around_green": "02569",
    "sg_putting": "02564",
}

RESULTS_QUERY = """
query PlayerProfileTournamentResults($playerId: ID!, $tourCode: TourCode) {
  playerProfileTournamentResults(playerId: $playerId, tourCode: $tourCode) {
    playerId
    tournaments {
      tournamentNum
      tournaments {
        tournamentId tournamentName courseName date startDate year position total toPar winnings
      }
    }
  }
}
"""

STAT_DETAILS_QUERY = """
query StatDetails($tourCode: TourCode!, $statId: String!, $year: Int, $eventQuery: StatDetailEventQuery) {
  statDetails(tourCode: $tourCode, statId: $statId, year: $year, eventQuery: $eventQuery) {
    rows {
      ... on StatDetailsPlayer {
        playerId
        stats { statName statValue }
      }
    }
  }
}
"""


def graphql(query, variables, operation_name=None, retries=3):
    body = {"query": query, "variables": variables}
    if operation_name:
        body["operationName"] = operation_name
    req = urllib.request.Request(
        ORCHESTRATOR_URL, data=json.dumps(body).encode(), headers=HEADERS, method="POST"
    )
    for attempt in range(retries):
        try:
            resp = urllib.request.urlopen(req, timeout=25)
            return json.loads(resp.read())
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError):
            if attempt == retries - 1:
                raise
    return None


def fetch_player_tournaments(player_id):
    data = graphql(
        RESULTS_QUERY,
        {"playerId": player_id, "tourCode": "R"},
        operation_name="PlayerProfileTournamentResults",
    )
    groups = data["data"]["playerProfileTournamentResults"]["tournaments"]
    rows = []
    for g in groups:
        rows.extend(g["tournaments"])
    return rows


def parse_position(position):
    if not position:
        return None
    m = re.match(r"^T?(\d+)$", position.strip())
    return int(m.group(1)) if m else None


def parse_to_par(to_par):
    if not to_par:
        return None
    to_par = to_par.strip()
    if to_par == "E":
        return 0
    if re.match(r"^[+-]?\d+$", to_par):
        return int(to_par)
    return None


def parse_winnings(winnings):
    if not winnings:
        return None
    digits = re.sub(r"[^0-9.]", "", winnings)
    return float(digits) if digits else None


def parse_date(date_str):
    m = re.match(r"^(\d+)\.(\d+)\.(\d+)$", date_str.strip()) if date_str else None
    if not m:
        return None
    month, day, year = m.groups()
    return f"{year}-{int(month):02d}-{int(day):02d}"


def fetch_event_sg(player_id, tournament_id, year, stat_id):
    data = graphql(
        STAT_DETAILS_QUERY,
        {
            "tourCode": "R",
            "statId": stat_id,
            "year": year,
            "eventQuery": {"tournamentId": tournament_id, "queryType": "EVENT_ONLY"},
        },
        operation_name="StatDetails",
    )
    rows = (data.get("data") or {}).get("statDetails", {}).get("rows") or []
    for r in rows:
        if r["playerId"] == player_id:
            for s in r["stats"]:
                if s["statName"] == "Avg":
                    try:
                        return float(s["statValue"])
                    except ValueError:
                        return None
    return None


def fetch_tournament_sg(player_id, tournament_id, year):
    result = {}
    for key, stat_id in SG_CATEGORIES.items():
        try:
            result[key] = fetch_event_sg(player_id, tournament_id, year, stat_id)
        except Exception:
            result[key] = None
    return result


def main():
    out_path = "scripts/extended_stats_raw/tournament_results.jsonl"
    written = 0

    with open(out_path, "w") as out:
        for player_id in PLAYER_IDS:
            print(f"Fetching tournament list for player {player_id}...")
            tournaments = fetch_player_tournaments(player_id)
            print(f"  {len(tournaments)} tournaments found")

            print("  Fetching per-tournament strokes-gained splits...")
            with ThreadPoolExecutor(max_workers=8) as pool:
                futures = {
                    pool.submit(fetch_tournament_sg, player_id, t["tournamentId"], t["year"]): t
                    for t in tournaments
                }
                done = 0
                sg_by_tournament = {}
                for fut in as_completed(futures):
                    t = futures[fut]
                    sg_by_tournament[t["tournamentId"]] = fut.result()
                    done += 1
                    if done % 50 == 0:
                        print(f"    {done}/{len(tournaments)}")

            for t in tournaments:
                sg = sg_by_tournament.get(t["tournamentId"], {})
                row = {
                    "player_id": player_id,
                    "tournament_id": t["tournamentId"],
                    "tournament_name": t["tournamentName"],
                    "course_name": t["courseName"],
                    "season": t["year"],
                    "event_date": parse_date(t["date"]),
                    "position": t["position"],
                    "position_numeric": parse_position(t["position"]),
                    "to_par": parse_to_par(t["toPar"]),
                    "winnings": parse_winnings(t["winnings"]),
                    **sg,
                }
                out.write(json.dumps(row) + "\n")
                written += 1

    print(f"Done. Wrote {written} tournament-result rows to {out_path}")


if __name__ == "__main__":
    main()
