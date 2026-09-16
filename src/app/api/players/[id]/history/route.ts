import { getPlayerHistory } from "@/lib/queries";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/players/[id]/history">
) {
  const { id } = await ctx.params;
  try {
    const history = await getPlayerHistory(id);
    return Response.json(history);
  } catch {
    return Response.json({ error: "Failed to fetch player history" }, { status: 500 });
  }
}
