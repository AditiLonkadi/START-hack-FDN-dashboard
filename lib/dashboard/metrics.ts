import type { Matrix } from "@/lib/quantco/types";

export type GameMetric = { gameId: number; payoff: number; cumulativePayoff: number; rank: number | null };

export function buildTeamMetrics(matrix: Matrix, teamName = "FDN"): GameMetric[] {
  const target = matrix.items.find((item) => item.team_name === teamName);
  if (!target) throw new Error(`Team ${teamName} is not present in the leaderboard matrix.`);
  return matrix.game_ids.map((gameId, index) => {
    const cumulativeByTeam = matrix.items.map((item) => ({ team: item.team_name, score: item.cells.slice(0, index + 1).reduce((sum, value) => sum + value, 0) }));
    const targetScore = cumulativeByTeam.find((row) => row.team === teamName)?.score;
    // Competition ranking: teams tied on the same score share a rank.
    const rank = targetScore === undefined ? null : 1 + cumulativeByTeam.filter((row) => row.score > targetScore).length;
    return {
      gameId,
      payoff: target.cells[index],
      cumulativePayoff: targetScore ?? 0,
      rank,
    };
  });
}
