import { getDashboardData, getDashboardTransactions } from "@/lib/dashboard/data";
import { LiveRefresh } from "@/components/live-refresh";
import { dashboardConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" });

type Props = { searchParams: Promise<{ game?: string; page?: string; q?: string }> };
export default async function TransactionsPage({ searchParams }: Props) {
  try {
    const query = await searchParams;
    const { metrics } = await getDashboardData();
    const latest = metrics.at(-1);
    if (!latest) return <main className="mx-auto max-w-7xl px-5 py-10"><p>No completed games are available yet.</p></main>;
    const gameId = metrics.some((metric) => metric.gameId === Number(query.game)) ? Number(query.game) : latest.gameId;
    const transactions = await getDashboardTransactions(gameId);
    const term = (query.q ?? "").toLowerCase(); const filtered = transactions.filter((row) => !term || row.issuer.toLowerCase().includes(term) || row.reviewer.toLowerCase().includes(term) || String(row.line_item_index).includes(term)); const pageSize = 50; const page = Math.max(1, Number(query.page) || 1); const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize)); const items = filtered.slice((page - 1) * pageSize, page * pageSize); const accepted = filtered.filter((row) => row.accepted).length;
    return <main className="mx-auto max-w-7xl px-5 py-10"><LiveRefresh intervalSeconds={dashboardConfig.refreshSeconds} /><p className="text-sm font-medium text-sky-400">Transaction analysis</p><h1 className="mt-1 text-3xl font-bold text-white">Game {gameId} transactions</h1><form className="panel mt-5 flex flex-wrap gap-3 p-4"><select className="rounded border border-slate-700 bg-slate-950 p-2" name="game" defaultValue={gameId}>{metrics.map((metric) => <option key={metric.gameId} value={metric.gameId}>Game {metric.gameId}</option>)}</select><input className="rounded border border-slate-700 bg-slate-950 p-2" name="q" defaultValue={query.q} placeholder="Issuer, reviewer, line"/><button className="rounded bg-sky-500 px-4 py-2 font-medium text-slate-950">Filter</button></form><p className="mt-3 text-sm text-slate-400">{filtered.length} matching transactions · {filtered.length ? `${(100 * accepted / filtered.length).toFixed(1)}% accepted` : "No records"}.</p><div className="panel mt-5 overflow-x-auto p-5"><table><thead><tr><th>Line</th><th>Issuer</th><th>Reviewer</th><th>Accepted</th><th>Amount</th></tr></thead><tbody>{items.map((row, index) => <tr key={`${row.issuer}-${row.reviewer}-${row.line_item_index}-${index}`}><td>{row.line_item_index}</td><td>{row.issuer}</td><td>{row.reviewer}</td><td>{row.accepted ? <span className="text-emerald-400">Accepted</span> : <span className="text-rose-400">Rejected</span>}</td><td>{money.format(row.amount)}</td></tr>)}</tbody></table></div><div className="mt-4 flex gap-3 text-sm"><a className="rounded border border-slate-700 px-3 py-2" href={`/transactions?game=${gameId}&q=${encodeURIComponent(query.q ?? "")}&page=${Math.max(1,page-1)}`}>Previous</a><span className="py-2 text-slate-400">Page {page} of {totalPages}</span><a className="rounded border border-slate-700 px-3 py-2" href={`/transactions?game=${gameId}&q=${encodeURIComponent(query.q ?? "")}&page=${Math.min(totalPages,page+1)}`}>Next</a></div></main>;
  } catch (error) { return <main className="mx-auto max-w-3xl px-5 py-16"><div className="panel p-6 text-rose-300">Transaction data is unavailable. {error instanceof Error ? error.message : ""}</div></main>; }
}
