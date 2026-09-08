import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { headshotUrl, initials } from "@/lib/format";
import { TournamentHistogram } from "@/components/dashboard-experiment-histogram";
import { EarningsTrendChart } from "@/components/dashboard-experiment-earnings-chart";
import { TournamentResultsList } from "@/components/dashboard-experiment-tournament-list";
import { SgStripPlot } from "@/components/dashboard-experiment-sg-strip";
import type { PlayerTournamentResult } from "@/lib/queries";
import type { Player } from "@/lib/types";

// PGA Tour's team-event / no-individual-stroke-play sentinel; not a real finish.
const SENTINEL_POSITION = 900;

function formatToPar(value: number) {
  if (value === 0) return "E";
  return value > 0 ? `+${value}` : `${value}`;
}

const HISTOGRAM_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: "1-10", min: 1, max: 10 },
  { label: "11-20", min: 11, max: 20 },
  { label: "21-30", min: 21, max: 30 },
  { label: "31-40", min: 31, max: 40 },
  { label: "41-50", min: 41, max: 50 },
  { label: "51+", min: 51, max: Infinity },
];

export function PlayerDashboardExperiment({
  player,
  results,
}: {
  player: Player;
  results: PlayerTournamentResult[];
}) {
  const validPositions = results.filter(
    (r) => r.position_numeric !== null && r.position_numeric < SENTINEL_POSITION
  );

  const histogramData = HISTOGRAM_BUCKETS.map(({ label, min, max }) => ({
    bucket: label,
    count: validPositions.filter(
      (r) => r.position_numeric! >= min && r.position_numeric! <= max
    ).length,
  }));

  const scoredResults = results.filter((r) => r.to_par !== null);
  const avgToPar = scoredResults.length
    ? scoredResults.reduce((s, r) => s + r.to_par!, 0) / scoredResults.length
    : null;

  const top10Count = validPositions.filter((r) => r.position_numeric! <= 10).length;
  const top10Pct = validPositions.length ? top10Count / validPositions.length : 0;

  const seasons = Array.from(new Set(results.map((r) => r.season))).sort((a, b) => a - b);
  const seasonTotals = seasons.map((season) => ({
    season,
    total: results
      .filter((r) => r.season === season)
      .reduce((s, r) => s + (r.winnings ?? 0), 0),
  }));
  const earningsData = seasonTotals.map((s, i) => ({
    season: s.season,
    cumulative: seasonTotals.slice(0, i + 1).reduce((sum, x) => sum + x.total, 0),
  }));

  const sgCategories: { key: keyof PlayerTournamentResult; label: string }[] = [
    { key: "sg_off_the_tee", label: "Off the Tee" },
    { key: "sg_approach", label: "Approach" },
    { key: "sg_around_green", label: "Around the Green" },
    { key: "sg_putting", label: "Putting" },
  ];

  return (
    <div className="-mx-4 flex flex-col bg-[#eef2f4] sm:-mx-6 lg:flex-row">
      <aside className="shrink-0 bg-[#0b2a4a] px-5 py-6 text-white lg:w-56">
        <p className="font-heading text-xl font-black tracking-wide">
          PGA <span className="text-rose-300">TOUR</span>
        </p>
        <div className="mt-1 h-px w-10 bg-white/30" />

        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <Avatar className="size-20">
            <AvatarImage src={headshotUrl(player.player_id)} alt={player.player_name} />
            <AvatarFallback>{initials(player.player_name)}</AvatarFallback>
          </Avatar>
          <p className="font-medium">{player.player_name}</p>
          {player.country && <p className="text-xs text-slate-300">{player.country}</p>}
        </div>

        <div className="mt-8 space-y-2 text-sm">
          <Link
            href={`/players/${player.player_id}`}
            className="block rounded-md bg-white/10 px-3 py-2 font-medium text-white"
          >
            Player Performance
          </Link>
          <Link
            href={`/players/${player.player_id}/stats`}
            className="block rounded-md px-3 py-2 text-slate-300 hover:bg-white/10 hover:text-white"
          >
            Full stat breakdown
          </Link>
          <Link
            href={`/compare?a=${player.player_id}`}
            className="block rounded-md px-3 py-2 text-slate-300 hover:bg-white/10 hover:text-white"
          >
            Compare this player
          </Link>
          <Link
            href="/players"
            className="block rounded-md px-3 py-2 text-slate-300 hover:bg-white/10 hover:text-white"
          >
            ← All players
          </Link>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-5 py-6 sm:px-8">
        <div className="mb-6 border-b-2 border-[#0b2a4a] pb-3">
          <h1 className="font-heading text-2xl font-bold text-[#0b2a4a] sm:text-3xl">
            Player Performance <span className="font-medium text-[#3b6690]">| {player.player_name}</span>
          </h1>
          <p className="text-sm text-[#3b6690]">{results.length} Tournaments Played</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr_320px]">
          {/* Left column */}
          <div className="space-y-4">
            <div className="rounded-lg bg-[#0b2a4a] p-4">
              <p className="mb-2 text-xs font-medium text-slate-300">Cumulative Earnings</p>
              <EarningsTrendChart data={earningsData} />
            </div>

            <div className="rounded-lg bg-[#0b2a4a] p-4">
              <p className="mb-2 text-xs font-medium text-slate-300">
                Top 10 Rate ({Math.round(top10Pct * 100)}%)
              </p>
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#7fa8c9]"
                  style={{ width: `${top10Pct * 100}%` }}
                />
              </div>
              <p className="mt-6 font-heading text-4xl font-black text-white">
                {avgToPar === null ? "—" : formatToPar(Math.round(avgToPar * 10) / 10)}
              </p>
              <p className="text-sm text-slate-300">Career Avg Score to Par</p>
            </div>
          </div>

          {/* Middle column */}
          <div className="space-y-4">
            <div className="rounded-lg bg-[#0b2a4a] p-4">
              <p className="mb-2 text-xs font-medium text-slate-300">Count of Tournaments by Finish</p>
              <TournamentHistogram data={histogramData} />
            </div>

            <div className="rounded-lg bg-[#0b2a4a] p-4">
              <p className="mb-3 text-xs font-medium text-slate-300">Results &amp; Score to Par</p>
              <TournamentResultsList results={results} />
            </div>
          </div>

          {/* Right column */}
          <div className="rounded-lg bg-[#0b2a4a] p-4">
            <p className="mb-1 text-xs font-medium text-slate-300">Strokes Gained Distribution</p>
            <p className="mb-3 text-[11px] text-slate-500">
              Each dot is one tournament&apos;s SG average (majors run outside PGA Tour&apos;s
              ShotLink system, like The Masters and The Open, aren&apos;t tracked here)
            </p>
            {sgCategories.map(({ key, label }) => (
              <SgStripPlot
                key={key}
                label={label}
                values={results
                  .map((r) => r[key] as number | null)
                  .filter((v): v is number => v !== null)}
              />
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[#3b6690]">
          Design experiment inspired by a{" "}
          <a
            href="https://public.tableau.com/app/profile/edwardhayter/viz/PGATOUR_PLAYER_PERFORMANCE_DASHBOARD/PlayerPerformance"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Tableau Public dashboard by Edward Hayter
          </a>{" "}
          — visible on {player.player_name}&apos;s page only.
        </p>
      </main>
    </div>
  );
}
