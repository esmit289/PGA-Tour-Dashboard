import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlayerCombobox } from "@/components/player-combobox";
import { CompareChart } from "@/components/compare-chart";
import { CompareRadarChart } from "@/components/compare-radar-chart";
import { StatLabel } from "@/components/stat-label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getPlayer, getPlayerHistory, getPlayersForBrowse } from "@/lib/queries";
import { formatStat, headshotUrl, initials } from "@/lib/format";
import { STAT_DESCRIPTIONS } from "@/lib/glossary";
import { STAT_OPTIONS, type PlayerSeasonStat } from "@/lib/types";
import { cn } from "@/lib/utils";

const COLOR_A = "var(--chart-1)";
const COLOR_B = "var(--chart-4)";

// Radar axes: strokes-gained categories plus the two headline accuracy
// stats, all "higher is better" so the shape reads intuitively at a
// glance without any inverted axes.
const RADAR_KEYS = [
  "sg_off_the_tee",
  "sg_approach",
  "sg_around_green",
  "sg_putting",
  "driving_accuracy_pct",
  "gir_pct",
] as const satisfies readonly (keyof PlayerSeasonStat)[];

function winnerOf(
  a: number | null | undefined,
  b: number | null | undefined,
  lowerIsBetter: boolean
): "a" | "b" | null {
  if (a === null || a === undefined || b === null || b === undefined) return null;
  if (a === b) return null;
  if (lowerIsBetter) return a < b ? "a" : "b";
  return a > b ? "a" : "b";
}

function statCellProps(w: "a" | "b" | null, side: "a" | "b") {
  return {
    className: cn("text-right", w === side && "font-semibold"),
    style: w === side ? { color: side === "a" ? COLOR_A : COLOR_B } : undefined,
  };
}

const COMPARE_STATS = STAT_OPTIONS.filter((s) =>
  [
    "scoring_avg",
    "sg_total",
    "sg_off_the_tee",
    "sg_approach",
    "sg_around_green",
    "sg_putting",
    "driving_distance",
    "driving_accuracy_pct",
    "gir_pct",
    "putting_avg",
    "scrambling_pct",
    "sand_save_pct",
    "birdie_or_better_pct",
    "bogey_avoidance_pct",
    "wins",
    "top_10",
    "official_money",
    "fedexcup_rank",
    "world_rank",
  ].includes(s.key)
);

export default async function ComparePage({ searchParams }: PageProps<"/compare">) {
  const sp = await searchParams;
  const aId = typeof sp.a === "string" ? sp.a : undefined;
  const bId = typeof sp.b === "string" ? sp.b : undefined;

  const [playerA, playerB, allPlayers] = await Promise.all([
    aId ? getPlayer(aId).catch(() => null) : null,
    bId ? getPlayer(bId).catch(() => null) : null,
    getPlayersForBrowse(),
  ]);
  const [historyA, historyB] = await Promise.all([
    aId ? getPlayerHistory(aId) : Promise.resolve([]),
    bId ? getPlayerHistory(bId) : Promise.resolve([]),
  ]);

  const careerA = careerTotals(historyA);
  const careerB = careerTotals(historyB);

  const allSeasons = Array.from(
    new Set([...historyA.map((h) => h.season), ...historyB.map((h) => h.season)])
  ).sort((a, b) => a - b);

  const sgChartData = allSeasons.map((season) => ({
    season,
    a: historyA.find((h) => h.season === season)?.sg_total ?? null,
    b: historyB.find((h) => h.season === season)?.sg_total ?? null,
  }));

  const scoringChartData = allSeasons.map((season) => ({
    season,
    a: historyA.find((h) => h.season === season)?.scoring_avg ?? null,
    b: historyB.find((h) => h.season === season)?.scoring_avg ?? null,
  }));

  const radarStats = RADAR_KEYS.map((key) => {
    const opt = STAT_OPTIONS.find((s) => s.key === key)!;
    return {
      key,
      label: opt.label,
      format: opt.format,
      a: average(historyA.map((h) => h[key] as number | null)),
      b: average(historyB.map((h) => h[key] as number | null)),
      history: [
        ...historyA.map((h) => h[key] as number | null),
        ...historyB.map((h) => h[key] as number | null),
      ],
    };
  });

  const radarWinners = radarStats.map((s) => winnerOf(s.a, s.b, false));
  const aRadarWins = radarWinners.filter((w) => w === "a").length;
  const bRadarWins = radarWinners.filter((w) => w === "b").length;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-2xl font-heading font-bold sm:text-3xl">Compare Players</h1>
        <p className="text-muted-foreground">
          Pick two players to compare career stats, side by side.
        </p>
      </div>

      {!(playerA && playerB) && (
        <div className="flex flex-col gap-4 sm:flex-row">
          <PlayerCombobox paramKey="a" label="Player A" players={allPlayers} currentId={aId} />
          <PlayerCombobox paramKey="b" label="Player B" players={allPlayers} currentId={bId} />
        </div>
      )}

      {playerA && playerB ? (
        <>
          <Card className="border-border/60 overflow-hidden">
            <CardContent className="flex flex-col items-center gap-8 py-8">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-6 lg:gap-10">
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="size-28 sm:size-32">
                    <AvatarImage src={headshotUrl(playerA.player_id)} alt={playerA.player_name} />
                    <AvatarFallback className="text-2xl">
                      {initials(playerA.player_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <Link
                      href={`/players/${playerA.player_id}`}
                      className="block text-lg font-bold hover:underline"
                    >
                      {playerA.player_name}
                    </Link>
                    {playerA.country && <Badge variant="outline">{playerA.country}</Badge>}
                  </div>
                  <PlayerCombobox paramKey="a" label="Swap player A" players={allPlayers} currentId={aId} />
                </div>

                <div className="flex flex-col items-center gap-1">
                  <span className="font-heading text-2xl font-black text-accent sm:text-3xl">
                    VS
                  </span>
                  <CompareRadarChart
                    stats={radarStats}
                    nameA={playerA.player_name}
                    nameB={playerB.player_name}
                  />
                </div>

                <div className="flex flex-col items-center gap-3">
                  <Avatar className="size-28 sm:size-32">
                    <AvatarImage src={headshotUrl(playerB.player_id)} alt={playerB.player_name} />
                    <AvatarFallback className="text-2xl">
                      {initials(playerB.player_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <Link
                      href={`/players/${playerB.player_id}`}
                      className="block text-lg font-bold hover:underline"
                    >
                      {playerB.player_name}
                    </Link>
                    {playerB.country && <Badge variant="outline">{playerB.country}</Badge>}
                  </div>
                  <PlayerCombobox paramKey="b" label="Swap player B" players={allPlayers} currentId={bId} />
                </div>
              </div>

              <div className="w-full max-w-2xl border-t border-border/60 pt-5">
                <p className="mb-4 text-center text-base">
                  {aRadarWins === bRadarWins ? (
                    <>
                      Tied on the radar, {aRadarWins} out of {radarStats.length}
                    </>
                  ) : (
                    <>
                      <span
                        className="font-bold"
                        style={{ color: aRadarWins > bRadarWins ? COLOR_A : COLOR_B }}
                      >
                        {aRadarWins > bRadarWins ? playerA.player_name : playerB.player_name}
                      </span>{" "}
                      takes it, {Math.max(aRadarWins, bRadarWins)} out of {radarStats.length}
                    </>
                  )}
                </p>
                <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Who had the edge
                </p>
                <ul className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                  {radarStats.map((s, i) => {
                    const w = radarWinners[i];
                    return (
                      <li key={s.key} className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">{s.label}</span>
                        <span
                          className="font-semibold"
                          style={{ color: w === "a" ? COLOR_A : w === "b" ? COLOR_B : undefined }}
                        >
                          {w === "a" ? playerA.player_name : w === "b" ? playerB.player_name : "Tied"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>
                {playerA.player_name} vs {playerB.player_name}
              </CardTitle>
              <CardDescription>Strokes Gained: Total, by season</CardDescription>
            </CardHeader>
            <CardContent>
              <CompareChart
                data={sgChartData}
                nameA={playerA.player_name}
                nameB={playerB.player_name}
                format="decimal2"
              />
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>
                {playerA.player_name} vs {playerB.player_name}
              </CardTitle>
              <CardDescription>Scoring average, by season — lower is better</CardDescription>
            </CardHeader>
            <CardContent>
              <CompareChart
                data={scoringChartData}
                nameA={playerA.player_name}
                nameB={playerB.player_name}
                format="decimal3"
              />
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Career totals</CardTitle>
              <CardDescription>
                {historyA.length} seasons vs {historyB.length} seasons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stat</TableHead>
                    <TableHead className="text-right">{playerA.player_name}</TableHead>
                    <TableHead className="text-right">{playerB.player_name}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <StatLabel label="Wins" description={STAT_DESCRIPTIONS.wins} />
                    </TableCell>
                    <TableCell {...statCellProps(winnerOf(careerA.wins, careerB.wins, false), "a")}>
                      {careerA.wins}
                    </TableCell>
                    <TableCell {...statCellProps(winnerOf(careerA.wins, careerB.wins, false), "b")}>
                      {careerB.wins}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <StatLabel label="Top 10s" description={STAT_DESCRIPTIONS.top_10} />
                    </TableCell>
                    <TableCell {...statCellProps(winnerOf(careerA.top10, careerB.top10, false), "a")}>
                      {careerA.top10}
                    </TableCell>
                    <TableCell {...statCellProps(winnerOf(careerA.top10, careerB.top10, false), "b")}>
                      {careerB.top10}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <StatLabel label="Official Money" description={STAT_DESCRIPTIONS.official_money} />
                    </TableCell>
                    <TableCell {...statCellProps(winnerOf(careerA.money, careerB.money, false), "a")}>
                      {formatStat(careerA.money, "money")}
                    </TableCell>
                    <TableCell {...statCellProps(winnerOf(careerA.money, careerB.money, false), "b")}>
                      {formatStat(careerB.money, "money")}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <StatLabel label="Best Scoring Avg" description={STAT_DESCRIPTIONS.scoring_avg} />
                    </TableCell>
                    <TableCell {...statCellProps(winnerOf(careerA.bestScoring, careerB.bestScoring, true), "a")}>
                      {formatStat(careerA.bestScoring, "decimal3")}
                    </TableCell>
                    <TableCell {...statCellProps(winnerOf(careerA.bestScoring, careerB.bestScoring, true), "b")}>
                      {formatStat(careerB.bestScoring, "decimal3")}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <StatLabel label="Best SG: Total season" description={STAT_DESCRIPTIONS.sg_total} />
                    </TableCell>
                    <TableCell {...statCellProps(winnerOf(careerA.bestSg, careerB.bestSg, false), "a")}>
                      {formatStat(careerA.bestSg, "decimal2")}
                    </TableCell>
                    <TableCell {...statCellProps(winnerOf(careerA.bestSg, careerB.bestSg, false), "b")}>
                      {formatStat(careerB.bestSg, "decimal2")}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Career averages by category</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stat</TableHead>
                    <TableHead className="text-right">{playerA.player_name}</TableHead>
                    <TableHead className="text-right">{playerB.player_name}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {COMPARE_STATS.map((opt) => {
                    const avgA = average(historyA.map((h) => h[opt.key] as number | null));
                    const avgB = average(historyB.map((h) => h[opt.key] as number | null));
                    const w = winnerOf(avgA, avgB, opt.lowerIsBetter);
                    return (
                      <TableRow key={opt.key}>
                        <TableCell>
                          <StatLabel label={opt.label} description={STAT_DESCRIPTIONS[opt.key]} />
                        </TableCell>
                        <TableCell {...statCellProps(w, "a")}>
                          {formatStat(avgA, opt.format)}
                        </TableCell>
                        <TableCell {...statCellProps(w, "b")}>
                          {formatStat(avgB, opt.format)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-muted-foreground">
          Pick two players from the dropdowns above to see their comparison.
        </p>
      )}
    </div>
  );
}

function careerTotals(history: Awaited<ReturnType<typeof getPlayerHistory>>) {
  const wins = history.reduce((s, h) => s + (h.wins ?? 0), 0);
  const top10 = history.reduce((s, h) => s + (h.top_10 ?? 0), 0);
  const money = history.reduce((s, h) => s + (h.official_money ?? 0), 0);
  const scoringValues = history.map((h) => h.scoring_avg).filter((v): v is number => v !== null);
  const sgValues = history.map((h) => h.sg_total).filter((v): v is number => v !== null);
  return {
    wins,
    top10,
    money,
    bestScoring: scoringValues.length ? Math.min(...scoringValues) : null,
    bestSg: sgValues.length ? Math.max(...sgValues) : null,
  };
}

function average(values: (number | null)[]) {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
