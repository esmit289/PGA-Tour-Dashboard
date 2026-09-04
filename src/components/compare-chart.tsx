"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatStat } from "@/lib/format";

export function CompareChart({
  data,
  nameA,
  nameB,
  format = "decimal2",
}: {
  data: { season: number; a: number | null; b: number | null }[];
  nameA: string;
  nameB: string;
  format?: string;
}) {
  const config: ChartConfig = {
    a: { label: nameA, color: "var(--chart-1)" },
    b: { label: nameB, color: "var(--chart-4)" },
  };

  return (
    <ChartContainer config={config} className="h-72 w-full">
      <LineChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="season" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} width={44} domain={["auto", "auto"]} />
        <ChartTooltip
          content={
            <ChartTooltipContent formatter={(value) => formatStat(Number(value), format)} />
          }
        />
        <Legend />
        <Line
          dataKey="a"
          name={nameA}
          type="monotone"
          stroke="var(--color-a)"
          strokeWidth={2}
          dot={{ r: 3 }}
          connectNulls
        />
        <Line
          dataKey="b"
          name={nameB}
          type="monotone"
          stroke="var(--color-b)"
          strokeWidth={2}
          dot={{ r: 3 }}
          connectNulls
        />
      </LineChart>
    </ChartContainer>
  );
}
