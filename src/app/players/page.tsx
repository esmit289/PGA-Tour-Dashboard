import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { searchPlayers, getPlayersForBrowse } from "@/lib/queries";

export default async function PlayersPage({ searchParams }: PageProps<"/players">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";

  const players = q ? await searchPlayers(q, 60) : await getPlayersForBrowse(60);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Players</h1>
        <p className="text-muted-foreground">
          {q ? `Results for "${q}"` : "Browse players, A–Z"}
        </p>
      </div>

      <form action="/players" className="max-w-sm">
        <Input name="q" placeholder="Search by name..." defaultValue={q} />
      </form>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((p) => (
          <Link key={p.player_id} href={`/players/${p.player_id}`}>
            <Card className="border-border/60 transition hover:border-primary/60 hover:bg-secondary/40">
              <CardContent className="flex items-center justify-between py-4">
                <span className="font-medium">{p.player_name}</span>
                <span className="text-xs text-muted-foreground">{p.country ?? ""}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
        {players.length === 0 && (
          <p className="text-muted-foreground">No players found.</p>
        )}
      </div>
    </div>
  );
}
