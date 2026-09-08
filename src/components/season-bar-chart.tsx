"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatStat, formatCompactMoney } from "@/lib/format";

export function SeasonBarChart({
  data,
  label,
  format = "decimal2",
  color = "var(--chart-1)",
}: {
  data: { season: number; value: number }[];
  label: string;
  format?: string;
  color?: string;
}) {
  const config: ChartConfig = {
    value: { label, color },
  };
  // Full currency formatting ("$30,937,525") overflows a Y-axis label;
  // ticks get the compact form ("$31M") while the tooltip keeps full precision.
  const tickFormatter =
    format === "money" ? (v: number) => formatCompactMoney(v) : (v: number) => formatStat(v, format);

  return (
    <ChartContainer config={config} className="h-56 w-full">
      <BarChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="season" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
          width={format === "money" ? 56 : 44}
          tickFormatter={tickFormatter}
        />
        <ChartTooltip
          content={<ChartTooltipContent formatter={(value) => formatStat(Number(value), format)} />}
        />
        <Bar dataKey="value" fill="var(--color-value)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
