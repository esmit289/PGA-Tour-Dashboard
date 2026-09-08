import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart3 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { TrendChart } from "@/components/trend-chart";
import { SgBreakdownChart } from "@/components/sg-breakdown-chart";
import { SeasonBarChart } from "@/components/season-bar-chart";
import { WinsTop10Chart } from "@/components/wins-top10-chart";
import { StatLabel } from "@/components/stat-label";
import { getPlayer, getPlayerHistory } from "@/lib/queries";
import { formatStat, headshotUrl, initials } from "@/lib/format";
import { STAT_DESCRIPTIONS } from "@/lib/glossary";

export default async function PlayerPage({ params }: PageProps<"/players/[id]">) {
  const { id } = await params;

  let player;
  try {
    player = await getPlayer(id);
  } catch {
    notFound();
  }

  const history = await getPlayerHistory(id);
  if (!player || history.length === 0) notFound();

  const totalWins = history.reduce((sum, h) => sum + (h.wins ?? 0), 0);
  const totalMoney = history.reduce((sum, h) => sum + (h.official_money ?? 0), 0);
  const bestSg = Math.max(...history.map((h) => h.sg_total ?? -Infinity));

  const scoringTrend = history
    .filter((h) => h.scoring_avg !== null)
    .map((h) => ({ season: h.season, value: h.scoring_avg as number }));
  const sgTrend = history
    .filter((h) => h.sg_total !== null)
    .map((h) => ({ season: h.season, value: h.sg_total as number }));
  const drivingTrend = history
    .filter((h) => h.driving_distance !== null)
    .map((h) => ({ season: h.season, value: h.driving_distance as number }));
  const girTrend = history
    .filter((h) => h.gir_pct !== null)
    .map((h) => ({ season: h.season, value: h.gir_pct as number }));
  const moneyTrend = history
    .filter((h) => h.official_money !== null)
    .map((h) => ({ season: h.season, value: h.official_money as number }));
  const winsTop10Data = history
    .filter((h) => h.wins !== null || h.top_10 !== null)
    .map((h) => ({ season: h.season, wins: h.wins ?? 0, top10: h.top_10 ?? 0 }));

  const sgBreakdownSeason = [...history]
    .reverse()
    .find((h) =>
      [h.sg_off_the_tee, h.sg_approach, h.sg_around_green, h.sg_putting].some((v) => v !== null)
    );

  // A chart with only a couple of points reads as broken rather than
  // informative, so any season-by-season chart needs at least this many
  // real data points to show up at all.
  const MIN_CHART_POINTS = 5;

  const seasonCharts = [
    scoringTrend.length >= MIN_CHART_POINTS && (
      <Card key="scoring" className="border-border/60">
        <CardHeader>
          <CardTitle>Scoring average by season</CardTitle>
          <CardDescription>Lower is better</CardDescription>
        </CardHeader>
        <CardContent>
          <TrendChart data={scoringTrend} label="Scoring avg" format="decimal3" />
        </CardContent>
      </Card>
    ),
    sgTrend.length >= MIN_CHART_POINTS && (
      <Card key="sg-total" className="border-border/60">
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
    ),
    drivingTrend.length >= MIN_CHART_POINTS && (
      <Card key="driving" className="border-border/60">
        <CardHeader>
          <CardTitle>Driving distance by season</CardTitle>
          <CardDescription>Average yards per drive</CardDescription>
        </CardHeader>
        <CardContent>
          <TrendChart data={drivingTrend} label="Driving distance" format="decimal1" />
        </CardContent>
      </Card>
    ),
    girTrend.length >= MIN_CHART_POINTS && (
      <Card key="gir" className="border-border/60">
        <CardHeader>
          <CardTitle>Greens in Regulation by season</CardTitle>
          <CardDescription>Higher is better</CardDescription>
        </CardHeader>
        <CardContent>
          <TrendChart data={girTrend} label="GIR %" format="pct" />
        </CardContent>
      </Card>
    ),
    moneyTrend.length >= MIN_CHART_POINTS && (
      <Card key="money" className="border-border/60">
        <CardHeader>
          <CardTitle>Official money by season</CardTitle>
          <CardDescription>Prize money from official Tour events</CardDescription>
        </CardHeader>
        <CardContent>
          <SeasonBarChart data={moneyTrend} label="Money" format="money" color="var(--chart-3)" />
        </CardContent>
      </Card>
    ),
  ].filter(Boolean);

  const showWinsTop10 = winsTop10Data.length >= MIN_CHART_POINTS;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Avatar className="size-20 sm:size-24">
            <AvatarImage src={headshotUrl(player.player_id)} alt={player.player_name} />
            <AvatarFallback className="text-lg">{initials(player.player_name)}</AvatarFallback>
          </Avatar>
          <div>
            <Link href="/players" className="text-sm text-muted-foreground hover:underline">
              ← All players
            </Link>
            <h1 className="text-2xl font-heading font-bold sm:text-3xl">{player.player_name}</h1>
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
            <CardTitle className="font-heading text-3xl">{history.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>
              <StatLabel label="Career Wins" description={STAT_DESCRIPTIONS.wins} />
            </CardDescription>
            <CardTitle className="font-heading text-3xl text-accent">{totalWins}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>
              <StatLabel label="Career Official Money" description={STAT_DESCRIPTIONS.official_money} />
            </CardDescription>
            <CardTitle className="font-heading text-3xl">
              {formatStat(totalMoney, "money")}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>
            Strokes gained breakdown{sgBreakdownSeason ? ` — ${sgBreakdownSeason.season}` : ""}
          </CardTitle>
          <CardDescription>Where their game gains or loses strokes on the field</CardDescription>
        </CardHeader>
        <CardContent>
          <SgBreakdownChart values={sgBreakdownSeason ?? {}} />
        </CardContent>
      </Card>

      {seasonCharts.length > 0 && (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">{seasonCharts}</section>
      )}

      {showWinsTop10 && (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Wins &amp; Top 10 finishes by season</CardTitle>
            <CardDescription>Consistency and peak performances over time</CardDescription>
          </CardHeader>
          <CardContent>
            <WinsTop10Chart data={winsTop10Data} />
          </CardContent>
        </Card>
      )}

      <Link href={`/players/${player.player_id}/stats`}>
        <Card className="border-border/60 border-dashed transition-colors hover:border-primary/60 hover:bg-secondary/40">
          <CardContent className="flex items-center justify-between py-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                <BarChart3 className="size-5" />
              </span>
              <div>
                <p className="font-medium">View full stat breakdown</p>
                <p className="text-sm text-muted-foreground">
                  Every season, every category — 97 stats in total
                </p>
              </div>
            </div>
            <span className="text-muted-foreground">→</span>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
