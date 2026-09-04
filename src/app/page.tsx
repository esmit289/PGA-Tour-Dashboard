import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendChart } from "@/components/trend-chart";
import { getLeaderboard, getTourAverages } from "@/lib/queries";
import { formatStat } from "@/lib/format";
import { SEASONS } from "@/lib/types";

const LATEST_SEASON = SEASONS[SEASONS.length - 1];

const LEADER_CARDS = [
  { stat: "official_money" as const, label: "Money Leader", format: "money", lowerIsBetter: false },
  { stat: "sg_total" as const, label: "SG: Total Leader", format: "decimal2", lowerIsBetter: false },
  { stat: "scoring_avg" as const, label: "Scoring Avg Leader", format: "decimal3", lowerIsBetter: true },
  { stat: "wins" as const, label: "Wins Leader", format: "int", lowerIsBetter: false },
];

export default async function HomePage() {
  const [leaders, top5, avgTrend] = await Promise.all([
    Promise.all(
      LEADER_CARDS.map((c) =>
        getLeaderboard(LATEST_SEASON, c.stat, 1, { ascending: c.lowerIsBetter })
      )
    ),
    getLeaderboard(LATEST_SEASON, "sg_total", 5),
    getTourAverages("scoring_avg"),
  ]);

  const trendData = avgTrend.map((d) => ({ season: d.season, value: d.avg }));

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
      <section className="space-y-4">
        <Badge variant="outline" className="border-accent/50 text-accent">
          10 seasons · 2016–2026
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          A decade of the <span className="text-primary">PGA Tour</span>,
          <br />
          in the numbers.
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Scoring averages, strokes gained, driving stats, money and FedExCup
          standings for thousands of player-seasons from 2016 through 2026 —
          sourced directly from the Tour&apos;s own stats API.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/leaderboard"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Explore the leaderboard
          </Link>
          <Link
            href="/players"
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold transition hover:bg-secondary"
          >
            Browse players
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {LEADER_CARDS.map((card, i) => {
          const row = leaders[i][0];
          const value = row?.[card.stat] as number | null | undefined;
          return (
            <Card key={card.stat} className="border-border/60">
              <CardHeader className="pb-2">
                <CardDescription>{card.label}</CardDescription>
                <CardTitle className="text-lg">
                  {row ? row.players.player_name : "—"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-accent">
                  {formatStat(value, card.format)}
                </p>
                <p className="text-xs text-muted-foreground">{LATEST_SEASON} season</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-border/60">
          <CardHeader>
            <CardTitle>Tour scoring average, 2016–2026</CardTitle>
            <CardDescription>
              Average strokes-per-round across every qualifying player-season
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart
              data={trendData}
              label="Scoring avg"
              format="decimal3"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border/60">
          <CardHeader>
            <CardTitle>Top 5 · SG: Total ({LATEST_SEASON})</CardTitle>
            <CardDescription>Best overall strokes-gained seasons</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">SG:T</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top5.map((row, i) => (
                  <TableRow key={row.player_id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <Link
                        href={`/players/${row.player_id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {row.players.player_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatStat(row.sg_total, "decimal2")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
