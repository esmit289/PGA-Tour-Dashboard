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
import { getPlayer, getPlayerHistory } from "@/lib/queries";
import { formatStat, headshotUrl } from "@/lib/format";

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

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Avatar className="size-20 sm:size-24">
            <AvatarImage
              src={headshotUrl(player.player_id)}
              alt={player.player_name}
            />
            <AvatarFallback className="text-lg">
              {player.player_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </AvatarFallback>
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
            <CardDescription>Career Wins</CardDescription>
            <CardTitle className="text-2xl text-accent">{totalWins}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>Career Official Money</CardDescription>
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
          <CardTitle>Season-by-season stats</CardTitle>
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
    </div>
  );
}
