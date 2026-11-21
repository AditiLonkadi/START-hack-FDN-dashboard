"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { GameMetric } from "@/lib/dashboard/metrics";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export function PayoffCharts({ metrics }: { metrics: GameMetric[] }) {
  const chartData = metrics.map((metric) => ({ ...metric, game: `G${metric.gameId}` }));
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <ChartCard title="Per-game payoff" data={chartData} dataKey="payoff" color="#22c55e" />
      <ChartCard title="Cumulative payoff" data={chartData} dataKey="cumulativePayoff" color="#38bdf8" />
      <ChartCard title="Historical rank" data={chartData} dataKey="rank" color="#f59e0b" reversed />
    </div>
  );
}

function ChartCard({ title, data, dataKey, color, reversed = false }: { title: string; data: Record<string, string | number | null>[]; dataKey: string; color: string; reversed?: boolean }) {
  return (
    <section className="panel min-h-80 p-5">
      <h2 className="mb-4 text-base font-semibold text-slate-100">{title}</h2>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 6, right: 16, top: 8, bottom: 0 }}>
            <CartesianGrid stroke="#23304a" strokeDasharray="3 3" />
            <XAxis dataKey="game" stroke="#94a3b8" tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} reversed={reversed} tickFormatter={(value) => reversed ? `#${value}` : money.format(value)} width={76} />
            <Tooltip contentStyle={{ background: "#111a2d", border: "1px solid #334155", borderRadius: 10 }} formatter={(value) => reversed ? `#${value}` : money.format(Number(value))} />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
