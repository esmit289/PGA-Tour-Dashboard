import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeaderboardFilters } from "@/components/leaderboard-filters";
import { getLeaderboard } from "@/lib/queries";
import { formatStat } from "@/lib/format";
import { SEASONS, STAT_OPTIONS, type StatKey } from "@/lib/types";

const LATEST_SEASON = SEASONS[SEASONS.length - 1];

export default async function LeaderboardPage({
  searchParams,
}: PageProps<"/leaderboard">) {
  const sp = await searchParams;
  const season = Number(sp.season) || LATEST_SEASON;
  const stat = (typeof sp.stat === "string" ? sp.stat : "sg_total") as StatKey;
  const search = typeof sp.q === "string" ? sp.q : "";

  const statOption = STAT_OPTIONS.find((s) => s.key === stat) ?? STAT_OPTIONS[0];
  const rows = await getLeaderboard(season, statOption.key, 100, {
    search: search || undefined,
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Leaderboard</h1>
        <p className="text-muted-foreground">
          Rank every player-season by any stat, {SEASONS[0]}–{SEASONS[SEASONS.length - 1]}.
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <LeaderboardFilters season={season} stat={statOption.key} search={search} />
          <CardDescription className="pt-2">
            {statOption.label} · {season} season · {rows.length} players
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">{statOption.label}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, i) => (
                  <TableRow key={row.player_id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <Link
                        href={`/players/${row.player_id}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {row.players.player_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.players.country ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-accent">
                      {formatStat(row[statOption.key] as number | null, statOption.format)}
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      No players match that search for this season.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
