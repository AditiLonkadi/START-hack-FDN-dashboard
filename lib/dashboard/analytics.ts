import type { Matrix, Performance } from "@/lib/quantco/types";
import type { GameMetric } from "@/lib/dashboard/metrics";

export type RankedTeam = { teamName: string; payoff: number; rank: number; previousRank: number | null; movement: number | null };

function rankRows(rows: { teamName: string; payoff: number }[]) {
  return [...rows].sort((a, b) => b.payoff - a.payoff).map((row) => ({ ...row, rank: 1 + rows.filter((other) => other.payoff > row.payoff).length }));
}

export function buildLeaderboard(matrix: Matrix): RankedTeam[] {
  const current = rankRows(matrix.items.map((team) => ({ teamName: team.team_name, payoff: team.total })));
  if (matrix.game_ids.length < 2) return current.map((team) => ({ ...team, previousRank: null, movement: null }));
  const previous = rankRows(matrix.items.map((team) => ({ teamName: team.team_name, payoff: team.cells.slice(0, -1).reduce((sum, value) => sum + value, 0) })));
  return current.map((team) => {
    const previousRank = previous.find((row) => row.teamName === team.teamName)?.rank ?? null;
    return { ...team, previousRank, movement: previousRank === null ? null : previousRank - team.rank };
  });
}

export function fdnGaps(teams: RankedTeam[]) {
  const index = teams.findIndex((team) => team.teamName === "FDN");
  if (index < 0) return { above: null, below: null };
  const fdn = teams[index];
  const above = teams[index - 1];
  const below = teams[index + 1];
  return {
    above: above ? { teamName: above.teamName, gap: above.payoff - fdn.payoff } : null,
    below: below ? { teamName: below.teamName, gap: fdn.payoff - below.payoff } : null,
  };
}

export function projection(metrics: GameMetric[], leaderboard: RankedTeam[], totalGames: number, assumedPerGame?: number) {
  const current = metrics.at(-1)?.cumulativePayoff ?? 0;
  const completed = metrics.length;
  const remaining = Math.max(0, totalGames - completed);
  const payoffs = metrics.map((metric) => metric.payoff);
  const mean = payoffs.length ? payoffs.reduce((sum, value) => sum + value, 0) / payoffs.length : null;
  const deviation = mean === null ? null : Math.sqrt(payoffs.reduce((sum, value) => sum + (value - mean) ** 2, 0) / payoffs.length);
  const rankFor = (payoff: number) => 1 + leaderboard.filter((team) => team.teamName !== "FDN" && team.payoff > payoff).length;
  const make = (label: string, perGame: number | null) => perGame === null ? { label, perGame, projected: null, rank: null } : { label, perGame, projected: current + perGame * remaining, rank: rankFor(current + perGame * remaining) };
  return { current, completed, remaining, mean, deviation, scenarios: [make("Pessimistic", mean === null || deviation === null ? null : mean - deviation), make("Baseline", mean), make("Optimistic", mean === null || deviation === null ? null : mean + deviation), make("Your scenario", assumedPerGame ?? null)] };
}

export function requiredAverageForRank(leaderboard: RankedTeam[], current: number, remaining: number, targetRank: number) {
  if (!remaining) return null;
  const opponents = leaderboard.filter((team) => team.teamName !== "FDN").sort((a, b) => b.payoff - a.payoff);
  const threshold = opponents[targetRank - 1]?.payoff;
  return threshold === undefined ? 0 : Math.max(0, (threshold + 0.01 - current) / remaining);
}

export function performanceRates(performance: Performance) {
  return {
    issuer: performance.issued_count ? performance.issued_accepted / performance.issued_count : null,
    reviewer: performance.reviewed_count ? performance.reviewed_accepted / performance.reviewed_count : null,
  };
}
