"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatStat } from "@/lib/format";

export function TrendChart({
  data,
  dataKey,
  label,
  format = "decimal2",
}: {
  data: { season: number; value: number }[];
  dataKey?: string;
  label: string;
  format?: string;
}) {
  const config: ChartConfig = {
    value: { label, color: "var(--chart-1)" },
  };

  return (
    <ChartContainer config={config} className="h-56 w-full">
      <LineChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="season"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
          width={44}
          domain={["auto", "auto"]}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent formatter={(value) => formatStat(Number(value), format)} />
          }
        />
        <Line
          dataKey={dataKey ?? "value"}
          type="monotone"
          stroke="var(--color-value)"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
