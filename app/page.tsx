import { PayoffCharts } from "@/components/payoff-charts";
import { getDashboardData } from "@/lib/dashboard/data";
import { LiveRefresh } from "@/components/live-refresh";
import { dashboardConfig } from "@/lib/config";

export const dynamic = "force-dynamic";
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 2 });

export default async function OverviewPage() {
  try {
    const { performance, metrics, fetchedAt } = await getDashboardData();
    const latest = metrics.at(-1);
    const issuedAcceptance = performance.issued_count ? performance.issued_accepted / performance.issued_count : null;
    const reviewedAcceptance = performance.reviewed_count ? performance.reviewed_accepted / performance.reviewed_count : null;
    return <main className="mx-auto max-w-7xl px-5 py-10"><LiveRefresh intervalSeconds={dashboardConfig.refreshSeconds} />
      <p className="text-sm font-medium text-sky-400">FDN / QuantCo Claim to Fame</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">Performance dashboard</h1>
      <p className="mt-3 max-w-2xl text-slate-400">Official public leaderboard data, collected server-side. Values are shown exactly as reported; unavailable data is never treated as zero.</p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Cumulative payoff" value={latest ? money.format(latest.cumulativePayoff) : "Unavailable"} tone={(latest?.cumulativePayoff ?? 0) < 0 ? "text-rose-400" : "text-emerald-400"} />
        <Metric label="Current rank" value={latest?.rank ? `#${latest.rank}` : "Unavailable"} />
        <Metric label="Games played" value={String(metrics.length)} />
        <Metric label="Issuer acceptance" value={issuedAcceptance === null ? "Unavailable" : `${(issuedAcceptance * 100).toFixed(1)}%`} />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2"><Metric label="Reviewer acceptance" value={reviewedAcceptance === null ? "Unavailable" : `${(reviewedAcceptance * 100).toFixed(1)}%`} /><Metric label="Last successful source fetch" value={new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "medium" }).format(new Date(fetchedAt))} /></div>
      <div className="mt-8"><PayoffCharts metrics={metrics} /></div>
      <section className="panel mt-8 overflow-x-auto p-5"><h2 className="mb-4 text-lg font-semibold text-white">Game-by-game results</h2><table><thead><tr><th>Game</th><th>Payoff</th><th>Cumulative</th><th>Rank</th></tr></thead><tbody>{metrics.map((metric) => <tr key={metric.gameId}><td>Game {metric.gameId}</td><td className={metric.payoff < 0 ? "text-rose-400" : "text-emerald-400"}>{money.format(metric.payoff)}</td><td>{money.format(metric.cumulativePayoff)}</td><td>{metric.rank ? `#${metric.rank}` : "Unavailable"}</td></tr>)}</tbody></table></section>
    </main>;
  } catch (error) {
    return <main className="mx-auto max-w-3xl px-5 py-16"><div className="panel p-6"><p className="text-rose-300">The official leaderboard could not be loaded right now.</p><p className="mt-2 text-sm text-slate-400">{error instanceof Error ? error.message : "Unknown data-source error"}. Please try again later.</p></div></main>;
  }
}

function Metric({ label, value, tone = "" }: { label: string; value: string; tone?: string }) { return <section className="panel p-5"><p className="metric-label">{label}</p><p className={`metric-value ${tone}`}>{value}</p></section>; }
