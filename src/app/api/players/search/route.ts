import { NextRequest, NextResponse } from "next/server";
import { searchPlayers } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 2) {
    return NextResponse.json({ players: [] });
  }
  const players = await searchPlayers(q, 10);
  return NextResponse.json({ players });
}
