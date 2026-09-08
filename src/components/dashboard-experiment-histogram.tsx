"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function TournamentHistogram({ data }: { data: { bucket: string; count: number }[] }) {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
        <XAxis
          dataKey="bucket"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={11}
          stroke="#94a3b8"
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={11} width={28} stroke="#94a3b8" />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.05)" }}
          contentStyle={{
            background: "#0b2a4a",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 8,
            fontSize: 12,
            color: "#e2e8f0",
          }}
        />
        <Bar dataKey="count" fill="#5b8bb0" radius={[3, 3, 0, 0]} />
      </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
