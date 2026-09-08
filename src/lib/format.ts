export function headshotUrl(playerId: string): string {
  return `https://pga-tour-res.cloudinary.com/image/upload/c_fill,d_headshots_default.png,f_auto,g_face:center,h_390,q_auto,w_390/headshots_${playerId}.png`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatStat(value: number | null | undefined, format: string): string {
  if (value === null || value === undefined) return "—";
  switch (format) {
    case "money":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);
    case "pct":
      return `${value.toFixed(1)}%`;
    case "decimal1":
      return value.toFixed(1);
    case "decimal2":
      return value.toFixed(2);
    case "decimal3":
      return value.toFixed(3);
    case "int":
      return Math.round(value).toLocaleString();
    default:
      return String(value);
  }
}

// Short form for chart axis ticks (e.g. "$31M") where full currency
// formatting like "$30,937,525" would overflow the axis width.
export function formatCompactMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

// "Competition ranking" (same convention golf leaderboards use): players
// tied on the sorted value share the same rank, and the rank after a tied
// group skips ahead by the group size (e.g. two players tied for 1st means
// the next player is 3rd, not 2nd). `values` must already be sorted in
// leaderboard order.
export function computeCompetitionRanks(
  values: (number | null)[]
): { rank: number; tied: boolean }[] {
  const result: { rank: number; tied: boolean }[] = new Array(values.length);
  let i = 0;
  while (i < values.length) {
    let j = i;
    while (j + 1 < values.length && values[j + 1] === values[i]) j++;
    const rank = i + 1;
    const tied = j > i;
    for (let k = i; k <= j; k++) {
      result[k] = { rank, tied };
    }
    i = j + 1;
  }
  return result;
}

export function ordinal(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  const rounded = Math.round(n);
  const mod100 = rounded % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${rounded}th`;
  switch (rounded % 10) {
    case 1:
      return `${rounded}st`;
    case 2:
      return `${rounded}nd`;
    case 3:
      return `${rounded}rd`;
    default:
      return `${rounded}th`;
  }
}
