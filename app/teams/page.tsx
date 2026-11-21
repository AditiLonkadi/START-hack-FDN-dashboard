import { LiveRefresh } from "@/components/live-refresh";
import { dashboardConfig } from "@/lib/config";
import { buildLeaderboard, performanceRates } from "@/lib/dashboard/analytics";
import { getDashboardData, getTeamPerformances } from "@/lib/dashboard/data";
import { quantco } from "@/lib/quantco/client";
import { CompetitionChart } from "@/components/competition-charts";

export const dynamic = "force-dynamic";
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
type Props = { searchParams: Promise<{ team?: string | string[]; sort?: string }> };

export default async function TeamsPage({ searchParams }: Props) {
  try {
    const query = await searchParams;
    const { matrix } = await getDashboardData();
    const allTeams = matrix.items.map((team) => team.team_name).sort();
    const requested = Array.isArray(query.team) ? query.team : query.team ? [query.team] : allTeams;
    const selected = [...new Set(["FDN", ...requested.filter((team) => allTeams.includes(team))])];
    const [performances, matchup] = await Promise.all([getTeamPerformances(selected), quantco.matchup()]);
    const byTeam = new Map(performances.map((performance) => [performance.team_name, performance]));
    const leaderboard = buildLeaderboard(matrix);
    const sort = query.sort ?? "payoff";
    const rows = selected.map((team) => ({ standing: leaderboard.find((row) => row.teamName === team)!, performance: byTeam.get(team)! })).sort((a, b) => sort === "income" ? b.performance.income - a.performance.income : sort === "costs" ? a.performance.costs - b.performance.costs : sort === "issuer" ? (performanceRates(b.performance).issuer ?? -1) - (performanceRates(a.performance).issuer ?? -1) : sort === "reviewer" ? (performanceRates(b.performance).reviewer ?? -1) - (performanceRates(a.performance).reviewer ?? -1) : b.standing.payoff - a.standing.payoff);
    const matchupRows = matchup.items.filter((row) => selected.includes(row.opponent));
    return <main className="mx-auto max-w-7xl px-5 py-10"><LiveRefresh intervalSeconds={dashboardConfig.refreshSeconds} /><p className="text-sm font-medium text-sky-400">Team intelligence</p><h1 className="mt-1 text-3xl font-bold text-white">Multi-team comparison</h1><p className="mt-2 text-slate-400">Actual public standings, performance summaries, and FDN’s verified matchup data. FDN stays included.</p>
      <form className="panel mt-6 p-5" method="get"><div className="flex flex-wrap gap-3">{allTeams.map((team) => <label className="flex items-center gap-2 text-sm text-slate-300" key={team}><input className="accent-sky-400" name="team" type="checkbox" value={team} defaultChecked={selected.includes(team)} disabled={team === "FDN"} />{team}</label>)}</div><div className="mt-4 flex flex-wrap items-center gap-3"><label className="text-sm text-slate-300">Sort <select className="ml-2 rounded border border-slate-700 bg-slate-950 p-2" defaultValue={sort} name="sort"><option value="payoff">Net payoff</option><option value="income">Issuer income</option><option value="costs">Reviewer costs</option><option value="issuer">Issuer acceptance</option><option value="reviewer">Reviewer acceptance</option></select></label><button className="rounded bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950">Update comparison</button></div></form>
      <section className="panel mt-6 overflow-x-auto p-5"><h2 className="text-lg font-semibold text-white">Performance comparison</h2><table className="mt-4"><thead><tr><th>Team</th><th>Rank</th><th>Net</th><th>Income</th><th>Costs</th><th>Issuer accept.</th><th>Reviewer accept.</th></tr></thead><tbody>{rows.map(({ standing, performance }) => { const rates = performanceRates(performance); return <tr className={standing.teamName === "FDN" ? "bg-sky-950/40" : ""} key={standing.teamName}><td className="font-medium text-white">{standing.teamName}</td><td>#{standing.rank}</td><td>{money.format(standing.payoff)}</td><td>{money.format(performance.income)}</td><td>{money.format(performance.costs)}</td><td>{rates.issuer === null ? "Unavailable" : `${(rates.issuer * 100).toFixed(1)}%`}</td><td>{rates.reviewer === null ? "Unavailable" : `${(rates.reviewer * 100).toFixed(1)}%`}</td></tr>; })}</tbody></table></section>
      <section className="mt-6 grid gap-5 lg:grid-cols-2"><div className="panel p-5"><h2 className="mb-3 font-semibold text-white">Cumulative payoff progression</h2><CompetitionChart matrix={matrix} teams={selected}/></div><div className="panel p-5"><h2 className="mb-3 font-semibold text-white">Rank progression</h2><CompetitionChart matrix={matrix} teams={selected} ranking/></div></section>
      <section className="panel mt-6 overflow-x-auto p-5"><h2 className="text-lg font-semibold text-white">Per-game payoff comparison</h2><table className="mt-4"><thead><tr><th>Team</th>{matrix.game_ids.map((gameId) => <th key={gameId}>G{gameId}</th>)}<th>Total</th></tr></thead><tbody>{rows.map(({ standing }) => { const team = matrix.items.find((row) => row.team_name === standing.teamName)!; return <tr className={standing.teamName === "FDN" ? "bg-sky-950/40" : ""} key={standing.teamName}><td className="font-medium text-white">{standing.teamName}</td>{team.cells.map((cell, index) => <td className={cell < 0 ? "text-rose-400" : "text-emerald-400"} key={index}>{money.format(cell)}</td>)}<td>{money.format(team.total)}</td></tr>; })}</tbody></table></section>
      <section className="panel mt-6 overflow-x-auto p-5"><h2 className="text-lg font-semibold text-white">FDN head-to-head by completed game</h2><p className="mt-1 text-sm text-slate-400">Positive values mean FDN outperformed that opponent in the public Matchup response; negative values mean the opponent performed better.</p><table className="mt-4"><thead><tr><th>Opponent</th>{matchup.game_ids.map((gameId) => <th key={gameId}>G{gameId}</th>)}<th>Total</th></tr></thead><tbody>{matchupRows.map((row) => <tr key={row.opponent}><td className="font-medium text-white">{row.opponent}</td>{row.cells.map((cell, index) => <td className={cell > 0 ? "text-emerald-400" : cell < 0 ? "text-rose-400" : ""} key={index}>{cell > 0 ? "FDN +" : cell < 0 ? "Opponent +" : "Tie"} {money.format(Math.abs(cell))}</td>)}<td>{money.format(row.total)}</td></tr>)}</tbody></table></section>
    </main>;
  } catch (error) { return <main className="mx-auto max-w-3xl px-5 py-16"><div className="panel p-6 text-rose-300">Team intelligence is unavailable. {error instanceof Error ? error.message : ""}</div></main>; }
}
