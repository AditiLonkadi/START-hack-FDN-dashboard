# FDN QuantCo Performance Dashboard

Server-rendered Next.js dashboard for the public QuantCo leaderboard. No tournament credentials are required or used.

## Setup

1. Install Node.js 20+.
2. Copy `.env.example` to `.env.local`.
3. For the deadline MVP, leave `DASHBOARD_DATA_MODE=live`. It needs no Supabase project or secrets.
4. Run `npm install`, then `npm run dev`.

The dashboard itself fetches public QuantCo data server-side and revalidates every 45 seconds by default (configurable from 30 to 60 seconds). In `live` mode persistence and `/api/ingest` are disabled.

## Optional Supabase persistence

Set `DASHBOARD_DATA_MODE=supabase`, create a Supabase project, run `supabase/migrations/001_dashboard.sql`, and add `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and a random `INGEST_CRON_SECRET` to `.env.local`. Call `POST /api/ingest` with `Authorization: Bearer <INGEST_CRON_SECRET>` from a scheduler every 2–5 minutes. The ingestion workflow fetches the matrix and performance each run; it fetches transactions only for a newly completed game and once more after a two-minute settlement delay.

## Data sources

Only the verified public QuantCo endpoints are used, all under `https://c2f.public.quantco.cloud`:

- `/leaderboard/api/matrix?page=1&game_limit=100`
- `/leaderboard/api/performance?team=FDN`
- `/leaderboard/api/games?completed_only=true&page_size=1000`
- `/leaderboard/api/matchup?team=FDN&page=1&game_limit=20`
- `/leaderboard/api/transactions?game_id={id}&team=FDN&page={page}`
