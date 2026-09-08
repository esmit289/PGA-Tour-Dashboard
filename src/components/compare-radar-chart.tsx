"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatStat } from "@/lib/format";

export interface RadarStat {
  key: string;
  label: string;
  format: string;
  a: number | null;
  b: number | null;
  history: (number | null)[];
}

export function CompareRadarChart({
  stats,
  nameA,
  nameB,
}: {
  stats: RadarStat[];
  nameA: string;
  nameB: string;
}) {
  const config: ChartConfig = {
    a: { label: nameA, color: "var(--chart-1)" },
    b: { label: nameB, color: "var(--chart-4)" },
  };

  // Each stat lives on its own scale (SG stats hover around -2..2, pct
  // stats around 0..100), so a radar chart needs every axis normalized to
  // a shared 0-100 range before it means anything visually. Scale each
  // axis using the actual min/max seen across both players' careers for
  // that stat, rather than a made-up universal range.
  const data = stats.map((s) => {
    const nums = s.history.filter((v): v is number => v !== null);
    const min = nums.length ? Math.min(...nums) : 0;
    const max = nums.length ? Math.max(...nums) : 0;
    const scale = (v: number | null) => {
      if (v === null) return 0;
      if (max === min) return 70;
      return 10 + ((v - min) / (max - min)) * 90;
    };
    return {
      stat: s.label,
      a: scale(s.a),
      b: scale(s.b),
      rawA: s.a,
      rawB: s.b,
      format: s.format,
    };
  });

  return (
    <ChartContainer config={config} className="mx-auto aspect-square h-56 w-56 sm:h-64 sm:w-64">
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid />
        <PolarAngleAxis dataKey="stat" tick={{ fontSize: 10 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name, item) => {
                const point = item.payload as (typeof data)[number];
                const raw = name === "a" ? point.rawA : point.rawB;
                const label = name === "a" ? nameA : nameB;
                return `${label}: ${formatStat(raw, point.format)}`;
              }}
            />
          }
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Radar name={nameA} dataKey="a" stroke="var(--color-a)" fill="var(--color-a)" fillOpacity={0.35} />
        <Radar name={nameB} dataKey="b" stroke="var(--color-b)" fill="var(--color-b)" fillOpacity={0.35} />
      </RadarChart>
    </ChartContainer>
  );
}
