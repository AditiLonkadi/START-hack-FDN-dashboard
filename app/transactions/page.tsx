import { getDashboardData, getDashboardTransactions } from "@/lib/dashboard/data";

export const revalidate = 45;

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" });

export default async function TransactionsPage() {
  try {
    const { metrics } = await getDashboardData();
    const latest = metrics.at(-1);
    if (!latest) return <main className="mx-auto max-w-7xl px-5 py-10"><p>No completed games are available yet.</p></main>;
    const transactions = await getDashboardTransactions(latest.gameId);
    return <main className="mx-auto max-w-7xl px-5 py-10"><p className="text-sm font-medium text-sky-400">Transaction analysis</p><h1 className="mt-1 text-3xl font-bold text-white">Game {latest.gameId} transactions</h1><p className="mt-2 text-slate-400">Showing every public FDN transaction for the latest completed game ({transactions.length} records).</p><div className="panel mt-7 overflow-x-auto p-5"><table><thead><tr><th>Line</th><th>Issuer</th><th>Reviewer</th><th>Accepted</th><th>Amount</th></tr></thead><tbody>{transactions.map((row, index) => <tr key={`${row.issuer}-${row.reviewer}-${row.line_item_index}-${index}`}><td>{row.line_item_index}</td><td>{row.issuer}</td><td>{row.reviewer}</td><td>{row.accepted ? <span className="text-emerald-400">Accepted</span> : <span className="text-rose-400">Rejected</span>}</td><td>{money.format(row.amount)}</td></tr>)}</tbody></table></div></main>;
  } catch (error) { return <main className="mx-auto max-w-3xl px-5 py-16"><div className="panel p-6 text-rose-300">Transaction data is unavailable. {error instanceof Error ? error.message : ""}</div></main>; }
}
