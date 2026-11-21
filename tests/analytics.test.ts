import assert from "node:assert/strict";
import test from "node:test";
import { activityFeed, buildLeaderboard, fdnGaps, projection, requiredAverageForRank, teamProgression } from "../lib/dashboard/analytics";
import { buildTeamMetrics } from "../lib/dashboard/metrics";
import { matrixSchema, type Matrix } from "../lib/quantco/types";
import { onlyCompletedGames } from "../lib/dashboard/data";

const matrix: Matrix = { page: 1, page_size: 3, total: 3, total_pages: 1, game_ids: [1, 2], items: [
  { team_name: "FDN", cells: [10, -5], total: 5 }, { team_name: "Alpha", cells: [5, 20], total: 25 }, { team_name: "Beta", cells: [0, 2], total: 2 },
] };

test("calculates cumulative payoff and historical rank", () => { const metrics = buildTeamMetrics(matrix); assert.deepEqual(metrics.map((m) => [m.cumulativePayoff, m.rank]), [[10, 1], [5, 2]]); });
test("calculates gaps and rank movement", () => { const board = buildLeaderboard(matrix); const fdn = board.find((row) => row.teamName === "FDN")!; assert.equal(fdn.movement, -1); assert.deepEqual(fdnGaps(board), { above: { teamName: "Alpha", gap: 20 }, below: { teamName: "Beta", gap: 3 } }); });
test("models remaining games without claiming future data", () => { const metrics = buildTeamMetrics(matrix); const result = projection(metrics, buildLeaderboard(matrix), 4, 8); assert.equal(result.remaining, 2); assert.equal(result.scenarios.at(-1)?.projected, 21); assert.equal(requiredAverageForRank(buildLeaderboard(matrix), 5, 2, 1), 10.005); });
test("keeps activity limited to completed metric data", () => { const events = activityFeed(matrix, buildTeamMetrics(matrix)); assert.equal(events.filter((event) => event.kind === "completed").length, 2); assert.equal(teamProgression(matrix, "FDN").length, 2); });
test("filters unfinished games and rejects malformed score rows", () => { assert.deepEqual(onlyCompletedGames(matrix, new Set([1])).game_ids, [1]); assert.throws(() => matrixSchema.parse({ ...matrix, items: [{ ...matrix.items[0], cells: [1] }] })); });
