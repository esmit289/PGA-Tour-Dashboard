import { getPlayersForBrowse } from "@/lib/queries";
import { WinPredictorClient } from "@/components/win-predictor-client";

export default async function WinPredictorPage() {
  const allPlayers = await getPlayersForBrowse();
  return <WinPredictorClient allPlayers={allPlayers} />;
}
