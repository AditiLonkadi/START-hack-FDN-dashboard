import assert from "node:assert/strict";
import test from "node:test";
import { activityFeed, buildLeaderboard, fdnGaps, projection, requiredAverageForRank, teamProgression } from "../lib/dashboard/analytics";
import { buildTeamMetrics } from "../lib/dashboard/metrics";
import { gamesSchema, matrixSchema, type Matrix } from "../lib/quantco/types";
import { onlyCompletedGames } from "../lib/dashboard/data";
import type { GameMetric } from "../lib/dashboard/metrics";

const matrix: Matrix = { page: 1, page_size: 3, total: 3, total_pages: 1, game_ids: [1, 2], items: [
  { team_name: "FDN", cells: [10, -5], total: 5 }, { team_name: "Alpha", cells: [5, 20], total: 25 }, { team_name: "Beta", cells: [0, 2], total: 2 },
] };

test("calculates cumulative payoff and historical rank", () => { const metrics = buildTeamMetrics(matrix); assert.deepEqual(metrics.map((m) => [m.cumulativePayoff, m.rank]), [[10, 1], [5, 2]]); });
test("calculates gaps and rank movement", () => { const board = buildLeaderboard(matrix); const fdn = board.find((row) => row.teamName === "FDN")!; assert.equal(fdn.movement, -1); assert.deepEqual(fdnGaps(board), { above: { teamName: "Alpha", gap: 20 }, below: { teamName: "Beta", gap: 3 } }); });
test("models remaining games without claiming future data", () => { const metrics = buildTeamMetrics(matrix); const result = projection(metrics, buildLeaderboard(matrix), 4, 8); assert.equal(result.remaining, 2); assert.equal(result.scenarios.at(-1)?.projected, 21); assert.equal(requiredAverageForRank(buildLeaderboard(matrix), 5, 2, 1), 10.005); });
test("keeps activity limited to completed metric data", () => { const events = activityFeed(matrix, buildTeamMetrics(matrix)); assert.equal(events.filter((event) => event.kind === "completed").length, 2); assert.equal(teamProgression(matrix, "FDN").length, 2); });
test("filters unfinished games and rejects malformed score rows", () => { assert.deepEqual(onlyCompletedGames(matrix, new Set([1])).game_ids, [1]); assert.throws(() => matrixSchema.parse({ ...matrix, items: [{ ...matrix.items[0], cells: [1] }] })); });

function rankEvents(metrics: GameMetric[]) { return activityFeed(matrix, metrics).filter((event) => event.kind === "rank-up" || event.kind === "rank-down"); }
test("creates rank improvement and decline events only for valid consecutive ranks", () => {
  assert.equal(rankEvents([{ gameId: 1, payoff: 1, cumulativePayoff: 1, rank: 4 }, { gameId: 2, payoff: 1, cumulativePayoff: 2, rank: 2 }])[0]?.kind, "rank-up");
  assert.equal(rankEvents([{ gameId: 1, payoff: 1, cumulativePayoff: 1, rank: 2 }, { gameId: 2, payoff: 1, cumulativePayoff: 2, rank: 5 }])[0]?.kind, "rank-down");
});
test("does not invent movement when a consecutive rank is unavailable", () => {
  assert.equal(rankEvents([{ gameId: 1, payoff: 1, cumulativePayoff: 1, rank: 2 }, { gameId: 2, payoff: 1, cumulativePayoff: 2, rank: null }]).length, 0);
  assert.equal(rankEvents([{ gameId: 1, payoff: 1, cumulativePayoff: 1, rank: null }, { gameId: 2, payoff: 1, cumulativePayoff: 2, rank: 2 }]).length, 0);
  assert.equal(rankEvents([{ gameId: 1, payoff: 1, cumulativePayoff: 1, rank: null }, { gameId: 2, payoff: 1, cumulativePayoff: 2, rank: null }]).length, 0);
});
test("accepts active game status while only completed IDs enter actual matrix data", () => {
  const games = gamesSchema.parse({ page: 1, page_size: 3, total: 3, total_pages: 1, items: [
    { id: 1, start_time: "2026-11-21T13:00:00Z", status: "completed" },
    { id: 2, start_time: "2026-11-21T13:13:20Z", status: "active" },
    { id: 3, start_time: "2026-11-21T13:26:40Z", status: "scheduled" },
  ] });
  const completed = new Set(games.items.filter((game) => game.status === "completed").map((game) => game.id));
  assert.deepEqual(onlyCompletedGames(matrix, completed).game_ids, [1]);
});
