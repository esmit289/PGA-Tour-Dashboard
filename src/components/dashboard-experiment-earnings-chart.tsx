"use client";

import { Area, AreaChart, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import { formatCompactMoney } from "@/lib/format";

export function EarningsTrendChart({ data }: { data: { season: number; cumulative: number }[] }) {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7fa8c9" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#7fa8c9" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="season"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={11}
            stroke="#94a3b8"
            interval="preserveStartEnd"
          />
          <Tooltip
            formatter={(value) => formatCompactMoney(Number(value))}
            labelFormatter={(label) => `Through ${label}`}
            contentStyle={{
              background: "#0b2a4a",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
              fontSize: 12,
              color: "#e2e8f0",
            }}
          />
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke="#7fa8c9"
            strokeWidth={2}
            fill="url(#earningsFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
