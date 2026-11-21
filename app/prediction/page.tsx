import { LiveRefresh } from "@/components/live-refresh";
import { ScenarioExplorer } from "@/components/scenario-explorer";
import { dashboardConfig } from "@/lib/config";
import { buildLeaderboard } from "@/lib/dashboard/analytics";
import { getDashboardData } from "@/lib/dashboard/data";
export const dynamic = "force-dynamic";
export default async function PredictionPage() { try { const { matrix, metrics, allGames, fetchedAt } = await getDashboardData(); return <main className="mx-auto max-w-7xl px-5 py-10"><LiveRefresh intervalSeconds={dashboardConfig.refreshSeconds}/><p className="text-sm font-medium text-violet-300">Prediction lab</p><h1 className="mt-1 text-3xl font-bold text-white">Scenario modelling, not future knowledge</h1><p className="mt-2 text-slate-400">The game count comes from the public games endpoint. Results remain estimates based on completed FDN rounds and frozen opponent totals as of {new Intl.DateTimeFormat("en-GB", {dateStyle:"medium",timeStyle:"short"}).format(new Date(fetchedAt))}.</p><ScenarioExplorer metrics={metrics} leaderboard={buildLeaderboard(matrix)} totalGames={allGames.length || metrics.length}/></main>; } catch (error) { return <main className="mx-auto max-w-3xl px-5 py-16"><div className="panel p-6 text-rose-300">Prediction data unavailable. {error instanceof Error ? error.message : ""}</div></main>; } }
