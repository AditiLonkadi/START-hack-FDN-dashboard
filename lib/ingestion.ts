import { createHash } from "node:crypto";
import { buildTeamMetrics } from "@/lib/dashboard/metrics";
import { quantco, type QuantcoPayload } from "@/lib/quantco/client";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

export async function collectPublicData(): Promise<QuantcoPayload> {
  const [matrix, performance, games] = await Promise.all([quantco.matrix(), quantco.performance(), quantco.completedGames()]);
  return { matrix, performance, games, transactions: new Map() };
}

export async function ingestPublicData() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase server configuration is missing.");
  const payload = await collectPublicData();
  const now = new Date();
  const { data: priorRefreshes, error: priorRefreshError } = await supabase
    .from("pending_game_refreshes")
    .select("game_id, refresh_after, refreshed_at")
    .in("game_id", payload.games.map((game) => game.id));
  if (priorRefreshError) throw priorRefreshError;
  const refreshByGame = new Map((priorRefreshes ?? []).map((row) => [row.game_id, row]));
  const transactionGameIds = payload.games.filter((game) => {
    const refresh = refreshByGame.get(game.id);
    return !refresh || (!refresh.refreshed_at && new Date(refresh.refresh_after) <= now);
  }).map((game) => game.id);
  payload.transactions = new Map(await Promise.all(transactionGameIds.map(async (gameId) => [gameId, await quantco.transactions(gameId)] as const)));
  const sourceHash = hash({ matrix: payload.matrix, performance: payload.performance });
  const { data: snapshot, error: snapshotError } = await supabase
    .from("leaderboard_snapshots")
    .upsert({ source_hash: sourceHash, source_url: `${quantco.baseUrl}/leaderboard/api/matrix?page=1&game_limit=100`, game_ids: payload.matrix.game_ids, matrix: payload.matrix }, { onConflict: "source_hash" })
    .select("id")
    .single();
  if (snapshotError) throw snapshotError;

  const metrics = buildTeamMetrics(payload.matrix, quantco.team);
  const resultRows = payload.matrix.items.flatMap((team) => payload.matrix.game_ids.map((gameId, index) => ({ snapshot_id: snapshot.id, game_id: gameId, team_name: team.team_name, payoff: team.cells[index] })));
  const { error: resultError } = await supabase.from("game_results").upsert(resultRows, { onConflict: "snapshot_id,game_id,team_name" });
  if (resultError) throw resultError;

  const { error: performanceError } = await supabase.from("team_performance_snapshots").upsert({ snapshot_id: snapshot.id, ...payload.performance }, { onConflict: "snapshot_id" });
  if (performanceError) throw performanceError;

  const transactionRows = [...payload.transactions].flatMap(([gameId, transactions]) => transactions.map((transaction) => ({
    record_hash: hash({ gameId, team: quantco.team, ...transaction }), game_id: gameId, team_name: quantco.team, ...transaction, last_seen_at: new Date().toISOString(),
  })));
  const { error: transactionError } = await supabase.from("fdn_transactions").upsert(transactionRows, { onConflict: "record_hash" });
  if (transactionError) throw transactionError;

  const newRefreshRows = payload.games.filter((game) => !refreshByGame.has(game.id)).map((game) => ({ game_id: game.id, completed_at: game.start_time, refresh_after: new Date(now.getTime() + 2 * 60_000).toISOString() }));
  const { error: refreshError } = newRefreshRows.length ? await supabase.from("pending_game_refreshes").upsert(newRefreshRows, { onConflict: "game_id" }) : { error: null };
  if (refreshError) throw refreshError;
  const dueRefreshIds = transactionGameIds.filter((gameId) => refreshByGame.has(gameId));
  if (dueRefreshIds.length) {
    const { error: markRefreshError } = await supabase.from("pending_game_refreshes").update({ refreshed_at: now.toISOString() }).in("game_id", dueRefreshIds);
    if (markRefreshError) throw markRefreshError;
  }

  return { snapshotId: snapshot.id, sourceHash, games: metrics.length, transactions: transactionRows.length };
}
