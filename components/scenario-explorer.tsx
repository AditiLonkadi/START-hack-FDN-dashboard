"use client";

import { useMemo, useState } from "react";
import type { RankedTeam } from "@/lib/dashboard/analytics";
import { projection, requiredAverageForRank } from "@/lib/dashboard/analytics";
import type { GameMetric } from "@/lib/dashboard/metrics";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export function ScenarioExplorer({ metrics, leaderboard, totalGames }: { metrics: GameMetric[]; leaderboard: RankedTeam[]; totalGames: number }) {
  const [amount, setAmount] = useState(0);
  const [targetRank, setTargetRank] = useState(1);
  const model = useMemo(() => projection(metrics, leaderboard, totalGames, amount), [metrics, leaderboard, totalGames, amount]);
  const needed = requiredAverageForRank(leaderboard, model.current, model.remaining, targetRank);
  return <section className="panel mt-8 p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-medium text-violet-300">Scenario model</p><h2 className="text-lg font-semibold text-white">Transparent payoff projections</h2></div><p className="max-w-xl text-xs text-slate-400">Estimates use FDN’s completed-game mean and population standard deviation. Opponents are held at their current actual totals; this is not a forecast of future results.</p></div><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-sm text-slate-300">Your payoff per remaining game<input className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></label><label className="text-sm text-slate-300">Target final rank<input className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" min={1} max={leaderboard.length} type="number" value={targetRank} onChange={(event) => setTargetRank(Math.max(1, Number(event.target.value)))} /></label></div><p className="mt-4 text-sm text-slate-400">{model.completed} completed · {model.remaining} remaining · historical mean {model.mean === null ? "Unavailable" : money.format(model.mean)} · required average for rank #{targetRank}: {needed === null ? "Unavailable (no remaining games)" : money.format(needed)}</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{model.scenarios.map((scenario) => <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4" key={scenario.label}><p className="text-sm text-slate-400">{scenario.label}</p><p className="mt-2 text-lg font-semibold text-white">{scenario.projected === null ? "Unavailable" : money.format(scenario.projected)}</p><p className="mt-1 text-sm text-slate-400">{scenario.rank === null ? "" : `Estimated rank #${scenario.rank}`}</p></div>)}</div></section>;
}
