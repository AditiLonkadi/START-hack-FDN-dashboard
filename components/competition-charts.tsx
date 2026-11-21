"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { teamProgression } from "@/lib/dashboard/analytics";
import type { Matrix } from "@/lib/quantco/types";

const palette = ["#38bdf8", "#a78bfa", "#22c55e", "#f59e0b", "#fb7185", "#14b8a6"];

export function CompetitionChart({ matrix, teams, ranking = false }: { matrix: Matrix; teams: string[]; ranking?: boolean }) {
  const rows = matrix.game_ids.map((gameId, index) => {
    const row: Record<string, string | number | null> = { game: `G${gameId}` };
    teams.forEach((team) => { const point = teamProgression(matrix, team)[index]; row[team] = ranking ? point?.rank ?? null : point?.cumulative ?? null; });
    return row;
  });
  return <div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={rows}><CartesianGrid stroke="#23304a" strokeDasharray="3 3" /><XAxis dataKey="game" stroke="#94a3b8" /><YAxis reversed={ranking} stroke="#94a3b8" /><Tooltip contentStyle={{ background: "#111a2d", border: "1px solid #334155", borderRadius: 10 }} /><Legend />{teams.map((team, index) => <Line key={team} type="monotone" dataKey={team} stroke={team === "FDN" ? "#38bdf8" : palette[index % palette.length]} strokeWidth={team === "FDN" ? 3 : 1.75} dot={false} connectNulls />)}</LineChart></ResponsiveContainer></div>;
}
