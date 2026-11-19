-- SmartSoko Board Finance — optional cloud database (Supabase, free tier)
-- Run this whole file in the Supabase SQL Editor of your free project.
-- After that, paste your Supabase URL + Anon Key into the app: Mipangilio -> Uhifadhi wa Data.
-- Default mode (no Supabase) keeps everything in the browser (localStorage) — free and offline.

-- ---------- MEMBERS ----------
create table if not exists public.board_members (
  id text primary key,
  full_name text not null,
  phone text default '',
  email text default '',
  position text default 'Mwanachama',
  required_amount numeric not null default 0,
  notes text default '',
  created_at timestamptz not null default now()
);

-- ---------- CAMPAIGNS (MICHA NGO) ----------
create table if not exists public.board_campaigns (
  id text primary key,
  name text not null,
  purpose text default '',
  target_amount numeric not null default 0,
  per_member_amount numeric not null default 0,
  start_date date,
  due_date date,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- ---------- PAYMENTS ----------
create table if not exists public.board_payments (
  id text primary key,
  member_id text references public.board_members(id) on delete cascade,
  campaign_id text references public.board_campaigns(id) on delete set null,
  amount numeric not null default 0,
  paid_on date not null default current_date,
  note text default '',
  receipt_url text default '',
  recorded_by text default '',
  created_at timestamptz not null default now()
);

-- ---------- EXPENSES ----------
create table if not exists public.board_expenses (
  id text primary key,
  title text not null,
  category text not null default 'operations',
  amount numeric not null default 0,
  spent_on date not null default current_date,
  approved_by text default '',
  approved_at timestamptz,
  status text not null default 'approved',
  note text default '',
  receipt_url text default '',
  recorded_by text default '',
  created_at timestamptz not null default now()
);

-- ---------- BUDGETS ----------
create table if not exists public.board_budgets (
  id text primary key,
  category text not null default 'operations',
  amount numeric not null default 0,
  period text not null default 'monthly',
  note text default '',
  created_at timestamptz not null default now()
);

-- ---------- AUDIT LOG ----------
create table if not exists public.board_audit (
  id text primary key,
  action text not null,
  detail text default '',
  actor text default '',
  role text default '',
  created_at timestamptz not null default now()
);

-- ---------- USERS / ROLES ----------
create table if not exists public.board_users (
  id text primary key,
  name text not null,
  email text not null unique,
  role text not null default 'member',
  member_id text references public.board_members(id) on delete set null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- ---------- ROW LEVEL SECURITY ----------
alter table public.board_members   enable row level security;
alter table public.board_campaigns enable row level security;
alter table public.board_payments  enable row level security;
alter table public.board_expenses  enable row level security;
alter table public.board_budgets   enable row level security;
alter table public.board_audit     enable row level security;
alter table public.board_users     enable row level security;

-- Authenticated users can read everything; writes allowed to authenticated users
-- (the app enforces CFO/accountant/CEO roles in the UI; tighten here if needed).
do $$ begin
  create policy "board_members_read"   on public.board_members   for select to authenticated using (true);
  create policy "board_members_write"  on public.board_members   for all    to authenticated using (true) with check (true);
  create policy "board_campaigns_read"  on public.board_campaigns for select to authenticated using (true);
  create policy "board_campaigns_write" on public.board_campaigns for all    to authenticated using (true) with check (true);
  create policy "board_payments_read"   on public.board_payments  for select to authenticated using (true);
  create policy "board_payments_write"  on public.board_payments  for all    to authenticated using (true) with check (true);
  create policy "board_expenses_read"   on public.board_expenses  for select to authenticated using (true);
  create policy "board_expenses_write"  on public.board_expenses  for all    to authenticated using (true) with check (true);
  create policy "board_budgets_read"    on public.board_budgets   for select to authenticated using (true);
  create policy "board_budgets_write"   on public.board_budgets   for all    to authenticated using (true) with check (true);
  create policy "board_audit_read"      on public.board_audit     for select to authenticated using (true);
  create policy "board_audit_write"     on public.board_audit     for all    to authenticated using (true) with check (true);
  create policy "board_users_read"      on public.board_users     for select to authenticated using (true);
  create policy "board_users_write"     on public.board_users     for all    to authenticated using (true) with check (true);
exception when duplicate_object then null;
end $$;

-- ---------- INDEXES ----------
create index if not exists idx_payments_member   on public.board_payments(member_id);
create index if not exists idx_payments_campaign on public.board_payments(campaign_id);
create index if not exists idx_expenses_status   on public.board_expenses(status);
create index if not exists idx_audit_created     on public.board_audit(created_at desc);
