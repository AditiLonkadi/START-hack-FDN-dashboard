import { NextRequest, NextResponse } from "next/server";
import { ingestPublicData } from "@/lib/ingestion";
import { dashboardConfig } from "@/lib/config";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (dashboardConfig.dataMode !== "supabase") {
    return NextResponse.json({ error: "Ingestion is disabled in live MVP mode." }, { status: 404 });
  }
  const secret = process.env.INGEST_CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json({ ok: true, ...(await ingestPublicData()) });
  } catch (error) {
    console.error("Ingestion failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ingestion failed" }, { status: 502 });
  }
}
