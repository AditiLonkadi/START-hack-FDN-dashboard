export type DashboardDataMode = "live" | "supabase";

export const dashboardConfig = {
  // Live mode is intentionally the default: it needs no credentials and reads only
  // the verified public QuantCo endpoints from server components.
  dataMode: (process.env.DASHBOARD_DATA_MODE === "supabase" ? "supabase" : "live") as DashboardDataMode,
  refreshSeconds: Math.min(60, Math.max(30, Number(process.env.DASHBOARD_REFRESH_SECONDS ?? 45) || 45)),
};
