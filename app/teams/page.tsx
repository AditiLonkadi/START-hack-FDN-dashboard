import { getDashboardData } from "@/lib/dashboard/data";
import { LiveRefresh } from "@/components/live-refresh";
import { dashboardConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });

export default async function TeamsPage() {
  try {
    const { matrix } = await getDashboardData();
    const teams = [...matrix.items].sort((a, b) => b.total - a.total);
    return <main className="mx-auto max-w-7xl px-5 py-10"><LiveRefresh intervalSeconds={dashboardConfig.refreshSeconds} /><p className="text-sm font-medium text-sky-400">Team comparison</p><h1 className="mt-1 text-3xl font-bold text-white">Current public standings</h1><p className="mt-2 text-slate-400">Ranking is derived from the cumulative matrix total returned by the official leaderboard.</p><div className="panel mt-7 overflow-x-auto p-5"><table><thead><tr><th>Rank</th><th>Team</th><th>Cumulative payoff</th></tr></thead><tbody>{teams.map((team, index) => <tr className={team.team_name === "FDN" ? "bg-sky-950/40" : ""} key={team.team_name}><td>#{index + 1}</td><td className="font-medium text-white">{team.team_name}</td><td className={team.total < 0 ? "text-rose-400" : "text-emerald-400"}>{money.format(team.total)}</td></tr>)}</tbody></table></div></main>;
  } catch (error) { return <main className="mx-auto max-w-3xl px-5 py-16"><div className="panel p-6 text-rose-300">Team data is unavailable. {error instanceof Error ? error.message : ""}</div></main>; }
}
