import { EXTENDED_CATEGORY_ORDER } from "@/lib/glossary";
import type { ExtendedStatRow } from "@/lib/types";

// Sub-metric field names aren't consistent across PGA Tour's 72 stat
// categories (e.g. "Avg", "Average Bogeys per round", or repeating the
// category's own title verbatim), so pick the headline value by excluding
// obvious denominator/count fields first, then preferring an exact "Avg"/"%"
// match, then a field that echoes the stat's title, then any field whose
// name suggests it's the summary metric.
export function pickHeadline(rows: ExtendedStatRow[]): ExtendedStatRow | undefined {
  if (rows.length === 0) return undefined;

  // A non-numeric sub-field (e.g. "Tourn/Course": "Charles Schwab/") can
  // never be the headline number, so drop those first unless it's all
  // we have.
  const numeric = rows.filter((r) => r.numeric_value !== null);
  let pool = numeric.length > 0 ? numeric : rows;

  // "Total" is excluded only when it's a raw-count field like "Total
  // Strokes" -- for composite stats like Total Driving, a bare "Total"
  // (or "Combined Rank") IS the headline, so those are left alone and
  // preferred explicitly below.
  const isSupportingField = (name: string) =>
    /^(total (strokes|holes?|distance|attempts|drives|birdies|bogeys|putts|rnds|rounds|dist)|rounds?( played)?|# of|measured|attempts|holes?|possible|tourn|course)/i.test(
      name
    );
  const nonSupporting = pool.filter((r) => !isSupportingField(r.stat_name));
  pool = nonSupporting.length > 0 ? nonSupporting : pool;

  for (const name of ["Avg", "%", "Value", "Total", "Combined Rank"]) {
    const exact = pool.find((r) => r.stat_name === name);
    if (exact) return exact;
  }
  const titleEcho = pool.find((r) => r.stat_name === r.stat_title);
  if (titleEcho) return titleEcho;
  const keywordMatch = pool.find((r) =>
    /avg|average|%|ratio|rating|streak|value|distance|combined/i.test(r.stat_name)
  );
  if (keywordMatch) return keywordMatch;
  return pool[0];
}

export interface ExtendedStatEntry {
  key: string;
  title: string;
  row: ExtendedStatRow;
}

// Groups a player's extended-stat rows for one season into
// category -> headline entries, skipping any stat with no value and any
// category that ends up empty, ordered per EXTENDED_CATEGORY_ORDER.
export function groupExtendedStatsBySeason(extendedStats: ExtendedStatRow[], season: number) {
  const seasonRows = extendedStats.filter((r) => r.season === season);
  const byStatKey = new Map<string, ExtendedStatRow[]>();
  for (const r of seasonRows) {
    if (!byStatKey.has(r.stat_key)) byStatKey.set(r.stat_key, []);
    byStatKey.get(r.stat_key)!.push(r);
  }

  const byCategory = new Map<string, ExtendedStatEntry[]>();
  for (const [key, rows] of byStatKey) {
    const headline = pickHeadline(rows);
    if (!headline) continue;
    if (!headline.stat_value || headline.stat_value === "-") continue;
    const category = headline.stat_category || "Other";
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category)!.push({ key, title: headline.stat_title, row: headline });
  }

  const categories = [...byCategory.keys()].sort((a, b) => {
    const ai = EXTENDED_CATEGORY_ORDER.indexOf(a);
    const bi = EXTENDED_CATEGORY_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return { categories, byCategory };
}
