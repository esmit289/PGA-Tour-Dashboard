"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ReferenceLine, Cell } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatStat } from "@/lib/format";

const SEGMENTS = [
  { key: "sg_off_the_tee", label: "Off the Tee", color: "var(--chart-1)" },
  { key: "sg_approach", label: "Approach", color: "var(--chart-2)" },
  { key: "sg_around_green", label: "Around Green", color: "var(--chart-3)" },
  { key: "sg_putting", label: "Putting", color: "var(--chart-4)" },
] as const;

export function SgBreakdownChart({
  values,
}: {
  values: Partial<Record<(typeof SEGMENTS)[number]["key"], number | null>>;
}) {
  const data = SEGMENTS.filter((s) => values[s.key] !== null && values[s.key] !== undefined).map(
    (s) => ({
      category: s.label,
      value: values[s.key] as number,
      color: s.color,
    })
  );

  const config: ChartConfig = Object.fromEntries(
    SEGMENTS.map((s) => [s.label, { label: s.label, color: s.color }])
  );

  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        No strokes gained data for this season.
      </div>
    );
  }

  return (
    <ChartContainer config={config} className="h-56 w-full">
      <BarChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="category" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} width={44} />
        <ReferenceLine y={0} stroke="var(--border)" />
        <ChartTooltip
          content={<ChartTooltipContent formatter={(value) => formatStat(Number(value), "decimal2")} />}
        />
        <Bar dataKey="value" radius={4}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
