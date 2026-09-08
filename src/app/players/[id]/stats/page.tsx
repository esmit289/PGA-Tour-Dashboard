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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { StatLabel } from "@/components/stat-label";
import { getPlayer, getPlayerHistory, getExtendedStatsForPlayer } from "@/lib/queries";
import { formatStat, headshotUrl, initials } from "@/lib/format";
import { STAT_DESCRIPTIONS, EXTENDED_STAT_DESCRIPTIONS } from "@/lib/glossary";
import { groupExtendedStatsBySeason } from "@/lib/extended-stats";
import { PROFILE_STAT_GROUPS } from "@/lib/types";
import { cn } from "@/lib/utils";

export default async function PlayerStatsPage({
  params,
  searchParams,
}: PageProps<"/players/[id]/stats">) {
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

  const extendedStats = await getExtendedStatsForPlayer(id);
  const { categories: extendedCategories, byCategory: extendedByCategory } =
    groupExtendedStatsBySeason(extendedStats, selectedSeason);

  // Skip seasons where every column shown in the overview table is empty
  // (the player has a row for that year, but nothing in these 8 headline
  // stats) so the table doesn't waste space on blank-looking seasons.
  const overviewRows = [...history].reverse().filter((h) =>
    [
      h.scoring_avg,
      h.sg_total,
      h.driving_distance,
      h.gir_pct,
      h.wins,
      h.top_10,
      h.official_money,
      h.fedexcup_rank,
    ].some((v) => v !== null && v !== undefined)
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-14">
          <AvatarImage src={headshotUrl(player.player_id)} alt={player.player_name} />
          <AvatarFallback>{initials(player.player_name)}</AvatarFallback>
        </Avatar>
        <div>
          <Link
            href={`/players/${player.player_id}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Back to {player.player_name}
          </Link>
          <h1 className="text-2xl font-heading font-bold sm:text-3xl">
            Full Stats — {player.player_name}
          </h1>
        </div>
      </div>

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
                {overviewRows.map((h) => (
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
                    <TableCell className="text-right">{formatStat(h.gir_pct, "pct")}</TableCell>
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
                href={`/players/${player.player_id}/stats?season=${season}`}
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
            {PROFILE_STAT_GROUPS.map((group) => {
              const visibleStats = group.stats.filter((stat) => {
                const value = seasonStats[stat.key] as number | null;
                return value !== null && value !== undefined;
              });
              if (visibleStats.length === 0) return null;
              return (
                <div key={group.title}>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                    {group.title}
                  </h3>
                  <dl className="space-y-1.5">
                    {visibleStats.map((stat) => {
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
              );
            })}
          </div>
        </CardContent>
      </Card>

      {extendedCategories.length > 0 && (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>More Stats — {selectedSeason}</CardTitle>
            <CardDescription>
              72 additional categories pulled directly from PGA Tour&apos;s stats site
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {extendedCategories.map((category) => (
                <div key={category}>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{category}</h3>
                  <dl className="space-y-1.5">
                    {extendedByCategory
                      .get(category)!
                      .sort((a, b) => a.title.localeCompare(b.title))
                      .map(({ key, title, row }) => (
                        <div
                          key={key}
                          className="flex items-baseline justify-between gap-2 text-sm"
                        >
                          <dt className="text-muted-foreground">
                            <StatLabel label={title} description={EXTENDED_STAT_DESCRIPTIONS[key]} />
                          </dt>
                          <dd className="font-medium">
                            {row.stat_value}
                            {row.rank !== null && (
                              <span className="ml-1.5 text-xs text-muted-foreground">
                                (#{row.rank})
                              </span>
                            )}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
