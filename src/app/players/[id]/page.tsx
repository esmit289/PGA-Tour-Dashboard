import Link from "next/link";
import { notFound } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { TrendChart } from "@/components/trend-chart";
import { StatLabel } from "@/components/stat-label";
import { getPlayer, getPlayerHistory } from "@/lib/queries";
import { formatStat, headshotUrl, initials } from "@/lib/format";
import { STAT_DESCRIPTIONS } from "@/lib/glossary";
import { PROFILE_STAT_GROUPS } from "@/lib/types";
import { cn } from "@/lib/utils";

export default async function PlayerPage({
  params,
  searchParams,
}: PageProps<"/players/[id]">) {
  const { id } = await params;
  const sp = await searchParams;

  let player;
  try {
    player = await getPlayer(id);
  } catch {
    notFound();
  }

  const history = await getPlayerHistory(id);
  if (!player || history.length === 0) notFound();

  const availableSeasons = history.map((h) => h.season);
  const requestedSeason = Number(sp.season);
  const selectedSeason = availableSeasons.includes(requestedSeason)
    ? requestedSeason
    : availableSeasons[availableSeasons.length - 1];
  const seasonStats = history.find((h) => h.season === selectedSeason)!;

  const totalWins = history.reduce((sum, h) => sum + (h.wins ?? 0), 0);
  const totalMoney = history.reduce((sum, h) => sum + (h.official_money ?? 0), 0);
  const bestSg = Math.max(...history.map((h) => h.sg_total ?? -Infinity));

  const scoringTrend = history
    .filter((h) => h.scoring_avg !== null)
    .map((h) => ({ season: h.season, value: h.scoring_avg as number }));
  const sgTrend = history
    .filter((h) => h.sg_total !== null)
    .map((h) => ({ season: h.season, value: h.sg_total as number }));

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Avatar className="size-20 sm:size-24">
            <AvatarImage
              src={headshotUrl(player.player_id)}
              alt={player.player_name}
            />
            <AvatarFallback className="text-lg">{initials(player.player_name)}</AvatarFallback>
          </Avatar>
          <div>
            <Link href="/players" className="text-sm text-muted-foreground hover:underline">
              ← All players
            </Link>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {player.player_name}
            </h1>
            {player.country && <Badge variant="outline">{player.country}</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/compare?a=${player.player_id}`}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary"
          >
            Compare this player
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>Seasons on Tour</CardDescription>
            <CardTitle className="text-2xl">{history.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>
              <StatLabel label="Career Wins" description={STAT_DESCRIPTIONS.wins} />
            </CardDescription>
            <CardTitle className="text-2xl text-accent">{totalWins}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>
              <StatLabel label="Career Official Money" description={STAT_DESCRIPTIONS.official_money} />
            </CardDescription>
            <CardTitle className="text-2xl">{formatStat(totalMoney, "money")}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Scoring average by season</CardTitle>
            <CardDescription>Lower is better</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart data={scoringTrend} label="Scoring avg" format="decimal3" />
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Strokes Gained: Total by season</CardTitle>
            <CardDescription>
              Best season: {Number.isFinite(bestSg) ? bestSg.toFixed(2) : "—"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart data={sgTrend} label="SG: Total" format="decimal2" />
          </CardContent>
        </Card>
      </section>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Career overview by season</CardTitle>
          <CardDescription>Headline stats only — see full breakdown below</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Season</TableHead>
                  <TableHead className="text-right">Scoring Avg</TableHead>
                  <TableHead className="text-right">SG: Total</TableHead>
                  <TableHead className="text-right">Driving Dist</TableHead>
                  <TableHead className="text-right">GIR %</TableHead>
                  <TableHead className="text-right">Wins</TableHead>
                  <TableHead className="text-right">Top 10s</TableHead>
                  <TableHead className="text-right">Money</TableHead>
                  <TableHead className="text-right">FedExCup Rank</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...history].reverse().map((h) => (
                  <TableRow key={h.season}>
                    <TableCell className="font-medium">{h.season}</TableCell>
                    <TableCell className="text-right">
                      {formatStat(h.scoring_avg, "decimal3")}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatStat(h.sg_total, "decimal2")}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatStat(h.driving_distance, "decimal1")}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatStat(h.gir_pct, "pct")}
                    </TableCell>
                    <TableCell className="text-right">{h.wins ?? "—"}</TableCell>
                    <TableCell className="text-right">{h.top_10 ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {formatStat(h.official_money, "money")}
                    </TableCell>
                    <TableCell className="text-right">{h.fedexcup_rank ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Full stat breakdown — {selectedSeason}</CardTitle>
          <CardDescription>Every recorded stat for this season, grouped by category</CardDescription>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {[...availableSeasons].reverse().map((season) => (
              <Link
                key={season}
                href={`/players/${player.player_id}?season=${season}`}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  season === selectedSeason
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {season}
              </Link>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PROFILE_STAT_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                  {group.title}
                </h3>
                <dl className="space-y-1.5">
                  {group.stats.map((stat) => {
                    const value = seasonStats[stat.key] as number | null;
                    const rank = stat.rankKey
                      ? (seasonStats[stat.rankKey] as number | null)
                      : null;
                    return (
                      <div
                        key={String(stat.key)}
                        className="flex items-baseline justify-between gap-2 text-sm"
                      >
                        <dt className="text-muted-foreground">
                          <StatLabel label={stat.label} description={STAT_DESCRIPTIONS[stat.key]} />
                        </dt>
                        <dd className="font-medium">
                          {formatStat(value, stat.format)}
                          {rank !== null && rank !== undefined && (
                            <span className="ml-1.5 text-xs text-muted-foreground">
                              (#{rank})
                            </span>
                          )}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
