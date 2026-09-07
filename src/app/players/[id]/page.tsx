import Link from "next/link";
import { notFound } from "next/navigation";
import { Rocket, Trees, Shuffle, Layers, Wind, Flag, CircleDot } from "lucide-react";
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
import { getPlayer, getPlayerHistory, getExtendedStatsForPlayer } from "@/lib/queries";
import { formatStat, headshotUrl, initials } from "@/lib/format";
import { STAT_DESCRIPTIONS } from "@/lib/glossary";
import { GOLF_BAGS } from "@/lib/golf-bags";
import { GolfBagIllustration } from "@/components/golf-bag-illustration";
import { PROFILE_STAT_GROUPS, type ExtendedStatRow } from "@/lib/types";
import { cn } from "@/lib/utils";

const BAG_CATEGORY_ICONS: Record<string, typeof Rocket> = {
  Driver: Rocket,
  "Fairway Wood": Trees,
  Hybrid: Shuffle,
  "Utility Iron": Layers,
  Irons: Layers,
  Wedges: Wind,
  Putter: Flag,
  Ball: CircleDot,
};

const EXTENDED_CATEGORY_ORDER = [
  "Scoring",
  "Off the Tee",
  "Approach",
  "Around the Green",
  "Putting",
  "Ratings",
  "Team & Majors",
  "Streaks",
  "Recent Form",
  "Swing Metrics",
];

// Sub-metric field names aren't consistent across PGA Tour's 72 stat
// categories (e.g. "Avg", "Average Bogeys per round", or repeating the
// category's own title verbatim), so pick the headline value by excluding
// obvious denominator/count fields first, then preferring an exact "Avg"/"%"
// match, then a field that echoes the stat's title, then any field whose
// name suggests it's the summary metric.
function pickHeadline(rows: ExtendedStatRow[]): ExtendedStatRow | undefined {
  if (rows.length === 0) return undefined;

  // A non-numeric sub-field (e.g. "Tourn/Course": "Charles Schwab/") can
  // never be the headline number, so drop those first unless it's all
  // we have.
  const numeric = rows.filter((r) => r.numeric_value !== null);
  let pool = numeric.length > 0 ? numeric : rows;

  // "Total" is excluded only when it's a raw-count field like "Total
  // Strokes" -- for composite stats like Total Driving, a bare "Total"
  // (or "Combined Rank") IS the headline, so those are left alone and
  // preferred explicitly below.
  const isSupportingField = (name: string) =>
    /^(total (strokes|holes?|distance|attempts|drives|birdies|bogeys|putts|rnds|rounds|dist)|rounds?( played)?|# of|measured|attempts|holes?|possible|tourn|course)/i.test(
      name
    );
  const nonSupporting = pool.filter((r) => !isSupportingField(r.stat_name));
  pool = nonSupporting.length > 0 ? nonSupporting : pool;

  for (const name of ["Avg", "%", "Value", "Total", "Combined Rank"]) {
    const exact = pool.find((r) => r.stat_name === name);
    if (exact) return exact;
  }
  const titleEcho = pool.find((r) => r.stat_name === r.stat_title);
  if (titleEcho) return titleEcho;
  const keywordMatch = pool.find((r) =>
    /avg|average|%|ratio|rating|streak|value|distance|combined/i.test(r.stat_name)
  );
  if (keywordMatch) return keywordMatch;
  return pool[0];
}

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

  const bag = GOLF_BAGS[player.player_id];

  const availableSeasons = history.map((h) => h.season);
  const requestedSeason = Number(sp.season);
  const selectedSeason = availableSeasons.includes(requestedSeason)
    ? requestedSeason
    : availableSeasons[availableSeasons.length - 1];
  const seasonStats = history.find((h) => h.season === selectedSeason)!;

  const extendedStats = await getExtendedStatsForPlayer(id);
  const seasonExtended = extendedStats.filter((r) => r.season === selectedSeason);
  const byStatKey = new Map<string, ExtendedStatRow[]>();
  for (const r of seasonExtended) {
    if (!byStatKey.has(r.stat_key)) byStatKey.set(r.stat_key, []);
    byStatKey.get(r.stat_key)!.push(r);
  }
  const extendedByCategory = new Map<string, { key: string; title: string; row: ExtendedStatRow }[]>();
  for (const [key, rows] of byStatKey) {
    const headline = pickHeadline(rows);
    if (!headline) continue;
    if (!headline.stat_value || headline.stat_value === "-") continue;
    const category = headline.stat_category || "Other";
    if (!extendedByCategory.has(category)) extendedByCategory.set(category, []);
    extendedByCategory.get(category)!.push({ key, title: headline.stat_title, row: headline });
  }
  const extendedCategories = [...extendedByCategory.keys()].sort((a, b) => {
    const ai = EXTENDED_CATEGORY_ORDER.indexOf(a);
    const bi = EXTENDED_CATEGORY_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

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
            <h1 className="text-2xl font-heading font-bold sm:text-3xl">
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

      {bag && (
        <Card className="border-border/60 overflow-hidden bg-gradient-to-br from-primary/8 via-transparent to-accent/8">
          <CardHeader>
            <CardTitle>In the Bag</CardTitle>
            <CardDescription>Current equipment setup, as of {bag.updated}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
              <GolfBagIllustration items={bag.items} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {bag.items.map((item, i) => {
                  const Icon = BAG_CATEGORY_ICONS[item.category] ?? CircleDot;
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-border/60 bg-card/60 p-3"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">
                          {item.category}
                        </p>
                        <p className="truncate font-medium">
                          {item.brand} {item.model}
                        </p>
                        {item.detail && (
                          <p className="text-xs text-muted-foreground">{item.detail}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                    {category}
                  </h3>
                  <dl className="space-y-1.5">
                    {extendedByCategory
                      .get(category)!
                      .sort((a, b) => a.title.localeCompare(b.title))
                      .map(({ key, title, row }) => {
                        return (
                          <div
                            key={key}
                            className="flex items-baseline justify-between gap-2 text-sm"
                          >
                            <dt className="text-muted-foreground">{title}</dt>
                            <dd className="font-medium">
                              {row.stat_value}
                              {row.rank !== null && (
                                <span className="ml-1.5 text-xs text-muted-foreground">
                                  (#{row.rank})
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
      )}
    </div>
  );
}
