"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const config: ChartConfig = {
  wins: { label: "Wins", color: "var(--chart-2)" },
  top10: { label: "Top 10s", color: "var(--chart-4)" },
};

export function WinsTop10Chart({
  data,
}: {
  data: { season: number; wins: number; top10: number }[];
}) {
  return (
    <ChartContainer config={config} className="h-64 w-full">
      <BarChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="season" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} width={32} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Legend />
        <Bar dataKey="top10" name="Top 10s" fill="var(--color-top10)" radius={3} />
        <Bar dataKey="wins" name="Wins" fill="var(--color-wins)" radius={3} />
      </BarChart>
    </ChartContainer>
  );
}
