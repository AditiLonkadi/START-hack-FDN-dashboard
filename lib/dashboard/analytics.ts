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

export function teamProgression(matrix: Matrix, teamName: string) {
  const team = matrix.items.find((item) => item.team_name === teamName);
  if (!team) return [];
  return matrix.game_ids.map((gameId, index) => {
    const scores = matrix.items.map((item) => ({ teamName: item.team_name, payoff: item.cells.slice(0, index + 1).reduce((sum, value) => sum + value, 0) }));
    const rank = 1 + scores.filter((row) => row.payoff > (scores.find((row) => row.teamName === teamName)?.payoff ?? 0)).length;
    return { gameId, payoff: team.cells[index], cumulative: scores.find((row) => row.teamName === teamName)?.payoff ?? null, rank };
  });
}

export function recentTrend(metrics: GameMetric[], count = 3) {
  const values = metrics.map((metric) => metric.payoff);
  if (!values.length) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const recent = values.slice(-Math.min(count, values.length));
  const recentMean = recent.reduce((sum, value) => sum + value, 0) / recent.length;
  return { historicalMean: mean, recentMean, difference: recentMean - mean, period: recent.length };
}

export type ActivityEvent = { gameId: number; kind: "completed" | "rank-up" | "rank-down" | "overtook" | "overtaken" | "payoff"; text: string };

export function activityFeed(matrix: Matrix, metrics: GameMetric[]) {
  const events: ActivityEvent[] = [];
  const fdn = matrix.items.find((team) => team.team_name === "FDN");
  if (!fdn) return events;
  metrics.forEach((metric, index) => {
    events.push({ gameId: metric.gameId, kind: "completed", text: `Game ${metric.gameId} completed: FDN ${metric.payoff >= 0 ? "+" : ""}${metric.payoff.toFixed(2)} net.` });
    if (!index) return;
    const previous = metrics[index - 1];
    if (metric.rank < (previous.rank ?? metric.rank)) events.push({ gameId: metric.gameId, kind: "rank-up", text: `FDN gained ${previous.rank! - metric.rank!} place${previous.rank! - metric.rank! === 1 ? "" : "s"} to #${metric.rank}.` });
    if (metric.rank > (previous.rank ?? metric.rank)) events.push({ gameId: metric.gameId, kind: "rank-down", text: `FDN moved down ${metric.rank! - previous.rank!} place${metric.rank! - previous.rank! === 1 ? "" : "s"} to #${metric.rank}.` });
  });
  return events.slice(-8).reverse();
}

export function streak(values: number[]) {
  if (!values.length) return null;
  const positive = values.at(-1)! >= 0;
  let length = 0;
  for (let index = values.length - 1; index >= 0 && (values[index] >= 0) === positive; index -= 1) length += 1;
  return { positive, length };
}
