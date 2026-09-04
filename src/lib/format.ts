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
