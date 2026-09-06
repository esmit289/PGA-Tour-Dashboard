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
import { PlayerPicker } from "@/components/player-picker";
import { CompareChart } from "@/components/compare-chart";
import { StatLabel } from "@/components/stat-label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getPlayer, getPlayerHistory } from "@/lib/queries";
import { formatStat, headshotUrl, initials } from "@/lib/format";
import { STAT_DESCRIPTIONS } from "@/lib/glossary";
import { STAT_OPTIONS } from "@/lib/types";

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

  const [playerA, playerB] = await Promise.all([
    aId ? getPlayer(aId).catch(() => null) : null,
    bId ? getPlayer(bId).catch(() => null) : null,
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

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Compare Players</h1>
        <p className="text-muted-foreground">
          Pick two players to compare career stats, side by side.
        </p>
      </div>

      {!(playerA && playerB) && (
        <div className="flex flex-col gap-4 sm:flex-row">
          <PlayerPicker paramKey="a" label="Player A" currentName={playerA?.player_name} />
          <PlayerPicker paramKey="b" label="Player B" currentName={playerB?.player_name} />
        </div>
      )}

      {playerA && playerB ? (
        <>
          <Card className="border-border/60 overflow-hidden">
            <CardContent className="flex flex-col items-center gap-6 py-8 sm:flex-row sm:justify-center sm:gap-10">
              <div className="flex flex-col items-center gap-3">
                <Avatar className="size-28 sm:size-32">
                  <AvatarImage src={headshotUrl(playerA.player_id)} alt={playerA.player_name} />
                  <AvatarFallback className="text-2xl">
                    {initials(playerA.player_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="text-lg font-bold">{playerA.player_name}</p>
                  {playerA.country && <Badge variant="outline">{playerA.country}</Badge>}
                </div>
                <PlayerPicker paramKey="a" label="Swap player A" />
              </div>

              <span className="text-2xl font-black text-accent sm:text-3xl">VS</span>

              <div className="flex flex-col items-center gap-3">
                <Avatar className="size-28 sm:size-32">
                  <AvatarImage src={headshotUrl(playerB.player_id)} alt={playerB.player_name} />
                  <AvatarFallback className="text-2xl">
                    {initials(playerB.player_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="text-lg font-bold">{playerB.player_name}</p>
                  {playerB.country && <Badge variant="outline">{playerB.country}</Badge>}
                </div>
                <PlayerPicker paramKey="b" label="Swap player B" />
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
                    <TableCell className="text-right font-semibold text-accent">
                      {careerA.wins}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-accent">
                      {careerB.wins}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <StatLabel label="Top 10s" description={STAT_DESCRIPTIONS.top_10} />
                    </TableCell>
                    <TableCell className="text-right">{careerA.top10}</TableCell>
                    <TableCell className="text-right">{careerB.top10}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <StatLabel label="Official Money" description={STAT_DESCRIPTIONS.official_money} />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatStat(careerA.money, "money")}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatStat(careerB.money, "money")}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <StatLabel label="Best Scoring Avg" description={STAT_DESCRIPTIONS.scoring_avg} />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatStat(careerA.bestScoring, "decimal3")}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatStat(careerB.bestScoring, "decimal3")}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <StatLabel label="Best SG: Total season" description={STAT_DESCRIPTIONS.sg_total} />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatStat(careerA.bestSg, "decimal2")}
                    </TableCell>
                    <TableCell className="text-right">
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
                    return (
                      <TableRow key={opt.key}>
                        <TableCell>
                          <StatLabel label={opt.label} description={STAT_DESCRIPTIONS[opt.key]} />
                        </TableCell>
                        <TableCell className="text-right">
                          {formatStat(avgA, opt.format)}
                        </TableCell>
                        <TableCell className="text-right">
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
          Search and select two players above to see their comparison.
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
