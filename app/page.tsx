import { PayoffCharts } from "@/components/payoff-charts";
import { getDashboardData } from "@/lib/dashboard/data";
import { LiveRefresh } from "@/components/live-refresh";
import { dashboardConfig } from "@/lib/config";
import { activityFeed, buildLeaderboard, fdnGaps, performanceRates, recentTrend } from "@/lib/dashboard/analytics";
import { ScenarioExplorer } from "@/components/scenario-explorer";

export const dynamic = "force-dynamic";
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });

export default async function OverviewPage() {
  try {
    const { matrix, performance, metrics, allGames, fetchedAt } = await getDashboardData();
    const latest = metrics.at(-1);
    const { issuer: issuedAcceptance, reviewer: reviewedAcceptance } = performanceRates(performance);
    const leaderboard = buildLeaderboard(matrix);
    const gaps = fdnGaps(leaderboard);
    const strongest = metrics.length ? metrics.reduce((best, metric) => metric.payoff > best.payoff ? metric : best) : null;
    const weakest = metrics.length ? metrics.reduce((worst, metric) => metric.payoff < worst.payoff ? metric : worst) : null;
    const trend = recentTrend(metrics);
    const feed = activityFeed(matrix, metrics);
    const rankMovement = leaderboard.find((team) => team.teamName === "FDN")?.movement;
    const firstPlace = leaderboard.at(0);
    return <main className="mx-auto max-w-7xl px-5 py-10"><LiveRefresh intervalSeconds={dashboardConfig.refreshSeconds} />
      <p className="text-sm font-medium text-sky-400">FDN / QuantCo Claim to Fame</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">Performance dashboard</h1>
      <p className="mt-3 max-w-2xl text-slate-400">Official public leaderboard data, collected server-side. Values are shown exactly as reported; unavailable data is never treated as zero.</p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Cumulative payoff" value={latest ? money.format(latest.cumulativePayoff) : "Unavailable"} tone={(latest?.cumulativePayoff ?? 0) < 0 ? "text-rose-400" : "text-emerald-400"} />
        <Metric label="Current rank" value={latest?.rank ? `#${latest.rank}` : "Unavailable"} />
        <Metric label="Games played" value={String(metrics.length)} />
        <Metric label="Issuer acceptance" value={issuedAcceptance === null ? "Unavailable" : `${(issuedAcceptance * 100).toFixed(1)}%`} />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Rank movement" value={rankMovement === null || rankMovement === undefined ? "Unavailable" : rankMovement > 0 ? `+${rankMovement} places` : rankMovement < 0 ? `${rankMovement} places` : "No movement"} /><Metric label="Gap to first" value={firstPlace && latest ? money.format(Math.max(0, firstPlace.payoff - latest.cumulativePayoff)) : "Unavailable"} /><Metric label="Recent trend" value={trend ? `${money.format(trend.recentMean)} / game` : "Unavailable"} /><Metric label="Last successful source fetch" value={new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "medium" }).format(new Date(fetchedAt))} /></div>
      <div className="mt-8"><PayoffCharts metrics={metrics} /></div>
      <section className="panel mt-8 overflow-x-auto p-5"><div className="flex items-end justify-between gap-3"><div><p className="text-sm font-medium text-sky-400">Global leaderboard</p><h2 className="text-lg font-semibold text-white">All completed-game standings</h2></div><p className="text-sm text-slate-400">FDN gaps: {gaps.above ? `${money.format(gaps.above.gap)} to ${gaps.above.teamName}` : "leading"} · {gaps.below ? `${money.format(gaps.below.gap)} ahead of ${gaps.below.teamName}` : "no team below"}</p></div><table className="mt-4"><thead><tr><th>Rank</th><th>Team</th><th>Net payoff</th><th>Movement</th></tr></thead><tbody>{leaderboard.map((team) => <tr className={team.teamName === "FDN" ? "bg-sky-950/40" : ""} key={team.teamName}><td>#{team.rank}</td><td className="font-medium text-white">{team.teamName}</td><td className={team.payoff < 0 ? "text-rose-400" : "text-emerald-400"}>{money.format(team.payoff)}</td><td>{team.movement === null ? "—" : team.movement > 0 ? <span className="text-emerald-400">▲ {team.movement}</span> : team.movement < 0 ? <span className="text-rose-400">▼ {Math.abs(team.movement)}</span> : "—"}</td></tr>)}</tbody></table></section>
      <section className="mt-8 grid gap-4 md:grid-cols-3"><Metric label="Strongest completed game" value={strongest ? `G${strongest.gameId} · ${money.format(strongest.payoff)}` : "Unavailable"} /><Metric label="Weakest completed game" value={weakest ? `G${weakest.gameId} · ${money.format(weakest.payoff)}` : "Unavailable"} /><Metric label="Reviewer penalties" value={String(performance.reviewed_penalties)} /></section>
      <section className="panel mt-8 p-5"><p className="text-sm font-medium text-sky-400">Competition activity</p><h2 className="text-lg font-semibold text-white">Completed-round events</h2><div className="mt-4 space-y-3">{feed.length ? feed.map((event, index) => <div className="flex gap-3 text-sm" key={`${event.gameId}-${index}`}><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-400" /><p className="text-slate-300">{event.text}</p></div>) : <p className="text-sm text-slate-400">No completed-game activity is available yet.</p>}</div></section>
      <ScenarioExplorer metrics={metrics} leaderboard={leaderboard} totalGames={allGames.length || metrics.length} />
      <section className="panel mt-8 overflow-x-auto p-5"><h2 className="mb-4 text-lg font-semibold text-white">Game-by-game results</h2><table><thead><tr><th>Game</th><th>Payoff</th><th>Cumulative</th><th>Rank</th></tr></thead><tbody>{metrics.map((metric) => <tr key={metric.gameId}><td>Game {metric.gameId}</td><td className={metric.payoff < 0 ? "text-rose-400" : "text-emerald-400"}>{money.format(metric.payoff)}</td><td>{money.format(metric.cumulativePayoff)}</td><td>{metric.rank ? `#${metric.rank}` : "Unavailable"}</td></tr>)}</tbody></table></section>
    </main>;
  } catch (error) {
    return <main className="mx-auto max-w-3xl px-5 py-16"><div className="panel p-6"><p className="text-rose-300">The official leaderboard could not be loaded right now.</p><p className="mt-2 text-sm text-slate-400">{error instanceof Error ? error.message : "Unknown data-source error"}. Please try again later.</p></div></main>;
  }
}

function Metric({ label, value, tone = "" }: { label: string; value: string; tone?: string }) { return <section className="panel p-5"><p className="metric-label">{label}</p><p className={`metric-value ${tone}`}>{value}</p></section>; }
