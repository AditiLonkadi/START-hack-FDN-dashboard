create table if not exists public.leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_hash text not null unique,
  observed_at timestamptz not null default now(),
  source_url text not null,
  game_ids jsonb not null,
  matrix jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.game_results (
  snapshot_id uuid not null references public.leaderboard_snapshots(id) on delete cascade,
  game_id integer not null,
  team_name text not null,
  payoff numeric not null,
  primary key (snapshot_id, game_id, team_name)
);

create index if not exists game_results_team_game_idx on public.game_results(team_name, game_id);

create table if not exists public.team_performance_snapshots (
  snapshot_id uuid primary key references public.leaderboard_snapshots(id) on delete cascade,
  team_name text not null,
  income numeric not null,
  costs numeric not null,
  net numeric not null,
  issued_count integer not null,
  issued_accepted integer not null,
  reviewed_count integer not null,
  reviewed_accepted integer not null,
  reviewed_accepted_right integer not null,
  reviewed_accepted_wrong integer not null,
  reviewed_correct_rejections integer not null,
  reviewed_penalties integer not null
);

create table if not exists public.fdn_transactions (
  record_hash text primary key,
  game_id integer not null,
  team_name text not null,
  issuer text not null,
  reviewer text not null,
  line_item_index integer not null,
  accepted boolean not null,
  amount numeric not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists fdn_transactions_game_idx on public.fdn_transactions(game_id);

create table if not exists public.pending_game_refreshes (
  game_id integer primary key,
  refresh_after timestamptz not null,
  completed_at timestamptz not null default now(),
  refreshed_at timestamptz
);

alter table public.leaderboard_snapshots enable row level security;
alter table public.game_results enable row level security;
alter table public.team_performance_snapshots enable row level security;
alter table public.fdn_transactions enable row level security;
alter table public.pending_game_refreshes enable row level security;

create policy "public dashboard reads snapshots" on public.leaderboard_snapshots for select using (true);
create policy "public dashboard reads game results" on public.game_results for select using (true);
create policy "public dashboard reads performance" on public.team_performance_snapshots for select using (true);
create policy "public dashboard reads transactions" on public.fdn_transactions for select using (true);
