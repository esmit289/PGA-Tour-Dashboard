"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatStat } from "@/lib/format";

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

  return (
    <ChartContainer config={config} className="h-56 w-full">
      <BarChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="season" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} width={44} />
        <ChartTooltip
          content={<ChartTooltipContent formatter={(value) => formatStat(Number(value), format)} />}
        />
        <Bar dataKey="value" fill="var(--color-value)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
