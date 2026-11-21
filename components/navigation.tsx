import Link from "next/link";

export function Navigation() {
  return <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur"><nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-4"><Link className="font-semibold tracking-tight text-white" href="/">FDN <span className="text-sky-400">QuantCo</span></Link><div className="flex flex-wrap gap-3 text-sm text-slate-300"><Link href="/">Command</Link><Link href="/leaderboard">Leaderboard</Link><Link href="/teams">Competitors</Link><Link href="/strategy">Strategy</Link><Link href="/prediction">Lab</Link><Link href="/monitor">Monitor</Link><Link href="/transactions">Transactions</Link></div></nav></header>;
}
