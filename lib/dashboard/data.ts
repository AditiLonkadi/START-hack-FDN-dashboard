import { buildTeamMetrics } from "@/lib/dashboard/metrics";
import { quantco } from "@/lib/quantco/client";
import { dashboardConfig } from "@/lib/config";
import { matrixSchema, performanceSchema, type Transaction } from "@/lib/quantco/types";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function getLiveDashboard() {
  const [matrix, performance, games] = await Promise.all([quantco.matrix(), quantco.performance(), quantco.completedGames()]);
  return { matrix, performance, games, matchup: null, metrics: buildTeamMetrics(matrix, quantco.team), fetchedAt: new Date().toISOString() };
}

async function getSupabaseDashboard() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase mode requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  const { data: snapshot, error: snapshotError } = await supabase.from("leaderboard_snapshots").select("id, observed_at, matrix").order("observed_at", { ascending: false }).limit(1).maybeSingle();
  if (snapshotError) throw snapshotError;
  if (!snapshot) throw new Error("No persisted leaderboard snapshot exists yet. Run ingestion first, or use DASHBOARD_DATA_MODE=live.");
  const { data: rawPerformance, error: performanceError } = await supabase.from("team_performance_snapshots").select("*").eq("snapshot_id", snapshot.id).maybeSingle();
  if (performanceError) throw performanceError;
  if (!rawPerformance) throw new Error("The latest persisted snapshot does not include FDN performance data.");
  const matrix = matrixSchema.parse(snapshot.matrix);
  const performance = performanceSchema.parse(rawPerformance);
  return { matrix, performance, games: [], matchup: null, metrics: buildTeamMetrics(matrix, quantco.team), fetchedAt: snapshot.observed_at };
}

export function getDashboardData() {
  return dashboardConfig.dataMode === "supabase" ? getSupabaseDashboard() : getLiveDashboard();
}

export async function getDashboardTransactions(gameId: number): Promise<Transaction[]> {
  if (dashboardConfig.dataMode === "live") return quantco.transactions(gameId);
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase mode requires server credentials.");
  const { data, error } = await supabase.from("fdn_transactions").select("issuer, reviewer, line_item_index, accepted, amount").eq("game_id", gameId).order("line_item_index");
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, amount: Number(row.amount) }));
}
