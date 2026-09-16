"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatLabel } from "@/components/stat-label";
import { STAT_DESCRIPTIONS, EXTENDED_STAT_DESCRIPTIONS } from "@/lib/glossary";
import { headshotUrl, initials } from "@/lib/format";
import type { Player, PlayerSeasonStat } from "@/lib/types";
import { ChevronsUpDown } from "lucide-react";

// Deployed Modal API for the win-predictor pipeline (separate class
// project: github.com/esmit289/PGA-Tour-Dashboard-Win_Predictor).
// Intentionally hardcoded to the real live URL -- never localhost, never
// mock data.
const API_URL = "https://esmit289--pga-win-predictor-fastapi-app.modal.run";

interface FeatureBounds {
  min: number;
  max: number;
}

interface InfoResponse {
  metadata: {
    steps: string[];
    built_at: string;
    sklearn_version: string;
    n_training_rows: number;
    features: string[];
    target: string;
    coefficients: Record<string, number>;
  };
  feature_bounds: Record<string, FeatureBounds>;
  feature_defaults: Record<string, number>;
}

interface PredictResponse {
  predicted_win_season: boolean;
  win_probability: number;
}

const FEATURE_LABELS: Record<string, string> = {
  scoring_avg: "Scoring Average",
  driving_distance: "Driving Distance",
  driving_accuracy_pct: "Driving Accuracy %",
  gir_pct: "Greens in Regulation %",
  putting_avg: "Putting Average",
  putts_per_round: "Putts Per Round",
  scrambling_pct: "Scrambling %",
  sand_save_pct: "Sand Save %",
  par3_scoring_avg: "Par 3 Scoring Average",
  par4_scoring_avg: "Par 4 Scoring Average",
  par5_scoring_avg: "Par 5 Scoring Average",
  three_putt_avoidance: "3-Putt % (lower is better)",
  bounce_back: "Bounce-Back %",
  birdie_to_bogey_ratio: "Birdie-to-Bogey Ratio",
  birdie_or_better_pct: "Birdie or Better %",
  bogey_avoidance_pct: "Bogey % (lower is better)",
};

export function WinPredictorClient({ allPlayers }: { allPlayers: Player[] }) {
  const [info, setInfo] = useState<InfoResponse | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  // Held as raw text (not numbers) while editing -- coercing every
  // keystroke to a Number meant clearing a field to "" immediately became
  // the numeric 0, which then displayed as a literal "0" the next digit
  // got typed in front of (e.g. clearing "70.87" and typing "100" produced
  // "0100"). Converted to numbers only when actually submitting.
  const [values, setValues] = useState<Record<string, string>>({});
  const [season, setSeason] = useState("2024");
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [predictError, setPredictError] = useState<string | null>(null);

  // "Load a real player's season" state -- lets someone pick an actual
  // tour player + season and pre-fill the same form with their real
  // recorded stats, rather than typing numbers by hand.
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerHistory, setPlayerHistory] = useState<PlayerSeasonStat[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loadedSeasonStat, setLoadedSeasonStat] = useState<PlayerSeasonStat | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/info`)
      .then((res) => {
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        return res.json();
      })
      .then((data: InfoResponse) => {
        setInfo(data);
        setValues(
          Object.fromEntries(
            Object.entries(data.feature_defaults).map(([col, v]) => [col, String(v)])
          )
        );
      })
      .catch((err) => setInfoError(String(err)));
  }, []);

  async function handleSelectPlayer(player: Player) {
    setSelectedPlayer(player);
    setComboboxOpen(false);
    setPlayerHistory(null);
    setLoadedSeasonStat(null);
    setHistoryError(null);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/players/${player.player_id}/history`);
      if (!res.ok) throw new Error(`Lookup returned ${res.status}`);
      const history: PlayerSeasonStat[] = await res.json();
      setPlayerHistory(history);
      if (history.length > 0) {
        const mostRecent = [...history].sort((a, b) => b.season - a.season)[0];
        applySeasonStat(mostRecent);
      }
    } catch (err) {
      setHistoryError(String(err));
    } finally {
      setHistoryLoading(false);
    }
  }

  function applySeasonStat(stat: PlayerSeasonStat) {
    if (!info) return;
    setLoadedSeasonStat(stat);
    setSeason(String(stat.season));
    setValues((prev) => {
      const next = { ...prev };
      for (const col of info.metadata.features) {
        const raw = (stat as unknown as Record<string, number | null>)[col];
        next[col] = String(raw ?? info.feature_defaults[col]);
      }
      return next;
    });
    setResult(null);
  }

  function handleSelectSeason(seasonStr: string) {
    const stat = playerHistory?.find((h) => String(h.season) === seasonStr);
    if (stat) applySeasonStat(stat);
  }

  function handleResetToManual() {
    if (!info) return;
    setSelectedPlayer(null);
    setPlayerHistory(null);
    setLoadedSeasonStat(null);
    setHistoryError(null);
    setValues(
      Object.fromEntries(
        Object.entries(info.feature_defaults).map(([col, v]) => [col, String(v)])
      )
    );
    setSeason("2024");
    setResult(null);
  }

  async function handlePredict() {
    setPredicting(true);
    setPredictError(null);
    setResult(null);
    try {
      const numericValues = Object.fromEntries(
        Object.entries(values).map(([col, v]) => [col, v.trim() === "" ? 0 : Number(v)])
      );
      const numericSeason = season.trim() === "" ? 0 : Number(season);
      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...numericValues, season: numericSeason }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.detail ? JSON.stringify(body.detail) : `API returned ${res.status}`
        );
      }
      setResult(await res.json());
    } catch (err) {
      setPredictError(String(err));
    } finally {
      setPredicting(false);
    }
  }

  const sortedCoefficients = info
    ? Object.entries(info.metadata.coefficients).sort(
        (a, b) => Math.abs(b[1]) - Math.abs(a[1])
      )
    : [];
  const maxAbsCoefficient = sortedCoefficients.length
    ? Math.max(...sortedCoefficients.map(([, v]) => Math.abs(v)))
    : 1;

  const seasonOptions = playerHistory
    ? [...playerHistory].sort((a, b) => b.season - a.season)
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-2xl font-heading font-bold sm:text-3xl">Win Predictor</h1>
        <p className="text-muted-foreground">
          A gradient-boosted tree pipeline trained on 2016-2026 PGA Tour season stats predicts
          whether a stat line looks like a winning season. Live model served from Modal.
          Push the numbers as high or low as you want — see what it takes to look like a winner.
        </p>
      </div>

      {infoError && (
        <Card className="border-destructive/60">
          <CardContent className="py-4 text-sm text-destructive">
            Couldn&apos;t reach the prediction API: {infoError}
          </CardContent>
        </Card>
      )}

      {info && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Enter a season stat line</CardTitle>
              <CardDescription>
                Defaults are real tour-average values — but the limits are wide on purpose.
                Try a scoring average of 55 or a driving distance of 400 and see what happens.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Or load a real player&apos;s season
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboboxOpen}
                        className="flex-1 justify-between font-normal"
                      >
                        <span className="flex items-center gap-2 truncate">
                          {selectedPlayer && (
                            <Avatar className="size-5">
                              <AvatarImage
                                src={headshotUrl(selectedPlayer.player_id)}
                                alt={selectedPlayer.player_name}
                              />
                              <AvatarFallback className="text-[8px]">
                                {initials(selectedPlayer.player_name)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <span className="truncate">
                            {selectedPlayer ? selectedPlayer.player_name : "Pick a player..."}
                          </span>
                        </span>
                        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0">
                      <Command>
                        <CommandInput placeholder="Search players..." />
                        <CommandList>
                          <CommandEmpty>No player found.</CommandEmpty>
                          <CommandGroup>
                            {allPlayers.map((p) => (
                              <CommandItem
                                key={p.player_id}
                                value={p.player_name}
                                onSelect={() => handleSelectPlayer(p)}
                              >
                                {p.player_name}
                                {p.country && (
                                  <span className="ml-1.5 text-xs text-muted-foreground">
                                    {p.country}
                                  </span>
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {playerHistory && playerHistory.length > 0 && (
                    <Select
                      value={loadedSeasonStat ? String(loadedSeasonStat.season) : undefined}
                      onValueChange={handleSelectSeason}
                    >
                      <SelectTrigger className="w-full sm:w-32">
                        <SelectValue placeholder="Season" />
                      </SelectTrigger>
                      <SelectContent>
                        {seasonOptions.map((h) => (
                          <SelectItem key={h.season} value={String(h.season)}>
                            {h.season}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {historyLoading && (
                  <p className="mt-2 text-xs text-muted-foreground">Loading their stats...</p>
                )}
                {historyError && (
                  <p className="mt-2 text-xs text-destructive">
                    Couldn&apos;t load that player: {historyError}
                  </p>
                )}
                {playerHistory && playerHistory.length === 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    No recorded seasons for this player.
                  </p>
                )}
                {loadedSeasonStat && selectedPlayer && (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      Loaded {selectedPlayer.player_name}&apos;s real {loadedSeasonStat.season}{" "}
                      stats — they actually won{" "}
                      <span className="font-semibold text-foreground">
                        {loadedSeasonStat.wins ?? 0}
                      </span>{" "}
                      time{loadedSeasonStat.wins === 1 ? "" : "s"} that season.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetToManual}
                      className="shrink-0 text-xs text-muted-foreground underline hover:text-foreground"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              <div>
                <StatLabel
                  label="Season"
                  description="Season year, used to compare this stat line against its own season."
                />
                <Input
                  type="number"
                  value={season}
                  min={2000}
                  max={2100}
                  onChange={(e) => setSeason(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {info.metadata.features.map((col) => (
                  <div key={col}>
                    <StatLabel
                      label={FEATURE_LABELS[col] ?? col}
                      description={
                        STAT_DESCRIPTIONS[col as keyof typeof STAT_DESCRIPTIONS] ??
                        EXTENDED_STAT_DESCRIPTIONS[col]
                      }
                    />
                    <Input
                      type="number"
                      step="any"
                      value={values[col] ?? ""}
                      min={info.feature_bounds[col].min}
                      max={info.feature_bounds[col].max}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [col]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </div>
              <Button onClick={handlePredict} disabled={predicting} className="w-full">
                {predicting ? "Predicting..." : "Predict"}
              </Button>
              {predictError && <p className="text-sm text-destructive">{predictError}</p>}
              {result && (
                <div className="rounded-lg border border-border/60 bg-secondary/40 p-4 text-center">
                  <p className="font-heading text-3xl font-black text-accent">
                    {Math.round(result.win_probability * 100)}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    predicted chance of a win-season
                    {result.predicted_win_season ? " — looks like a winner" : " — not quite there"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>What leads to tournament wins</CardTitle>
              <CardDescription>
                How much the model leans on each stat: bars show permutation importance
                (accent = helps win-probability, muted = hurts it), each stat locked to its
                real golf direction so higher is never shown as bad for a stat where more is
                actually better.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="pb-2 text-xs text-muted-foreground">
                Bar length is how much shuffling that stat hurts the model&apos;s accuracy, not a
                per-unit effect size — read it as &quot;what the model leans on,&quot; not strict
                cause-and-effect. A few stats show up near zero because their information overlaps
                with other stats already in the list (e.g. Birdie-to-Bogey Ratio partly retreads
                ground already covered by Birdie or Better % and Bogey %).
              </p>
              {sortedCoefficients.map(([col, coef]) => (
                <div key={col} className="flex items-center gap-2 text-sm">
                  <span className="w-40 shrink-0 truncate">{FEATURE_LABELS[col] ?? col}</span>
                  <div className="relative h-4 flex-1 overflow-hidden rounded-sm bg-secondary/60">
                    <div
                      className={
                        coef >= 0
                          ? "absolute inset-y-0 left-1/2 bg-accent"
                          : "absolute inset-y-0 right-1/2 bg-muted-foreground/50"
                      }
                      style={{ width: `${(Math.abs(coef) / maxAbsCoefficient) * 50}%` }}
                    />
                    <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
                  </div>
                  <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                    {coef >= 0 ? "+" : ""}
                    {coef.toFixed(2)}
                  </span>
                </div>
              ))}
              <p className="pt-2 text-xs text-muted-foreground">
                Model: {info.metadata.steps.join(" → ")} · scikit-learn {info.metadata.sklearn_version} ·
                trained on {info.metadata.n_training_rows} player-seasons
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
