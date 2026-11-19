-- SmartSoko Board Finance — cloud database (Supabase, free tier)
-- Run this whole file in: Supabase Dashboard → SQL Editor → New query → Run.
-- The app auto-connects using the publishable key (no manual paste needed).

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

-- ---------- CAMPAIGNS (MICHANGO) ----------
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

-- ---------- GRANTS (anon key used by the app) ----------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;

-- ---------- ROW LEVEL SECURITY ----------
alter table public.board_members   enable row level security;
alter table public.board_campaigns enable row level security;
alter table public.board_payments  enable row level security;
alter table public.board_expenses  enable row level security;
alter table public.board_budgets   enable row level security;
alter table public.board_audit     enable row level security;
alter table public.board_users     enable row level security;

-- App manages its own auth, so allow anon access via publishable key.
do $$ begin
  create policy "board_members_all"   on public.board_members   for all to anon, authenticated using (true) with check (true);
  create policy "board_campaigns_all" on public.board_campaigns for all to anon, authenticated using (true) with check (true);
  create policy "board_payments_all"  on public.board_payments  for all to anon, authenticated using (true) with check (true);
  create policy "board_expenses_all"  on public.board_expenses  for all to anon, authenticated using (true) with check (true);
  create policy "board_budgets_all"   on public.board_budgets   for all to anon, authenticated using (true) with check (true);
  create policy "board_audit_all"     on public.board_audit     for all to anon, authenticated using (true) with check (true);
  create policy "board_users_all"     on public.board_users     for all to anon, authenticated using (true) with check (true);
exception when duplicate_object then null;
end $$;

-- ---------- INDEXES ----------
create index if not exists idx_payments_member   on public.board_payments(member_id);
create index if not exists idx_payments_campaign on public.board_payments(campaign_id);
create index if not exists idx_expenses_status   on public.board_expenses(status);
create index if not exists idx_audit_created     on public.board_audit(created_at desc);