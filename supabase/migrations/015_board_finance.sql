-- SmartSoko Board Finance schema (optional, for Supabase)
-- Run in Supabase SQL Editor to enable multi-user cloud storage.

create table if not exists public.board_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text default '',
  email text default '',
  position text default 'Mwanachama',
  required_amount numeric not null default 0,
  notes text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.board_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  purpose text default '',
  target_amount numeric not null default 0,
  per_member_amount numeric not null default 0,
  start_date date,
  due_date date,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.board_payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.board_members(id) on delete cascade,
  campaign_id uuid references public.board_campaigns(id) on delete set null,
  amount numeric not null default 0,
  paid_on date not null default current_date,
  note text default '',
  receipt_url text default '',
  recorded_by text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.board_expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'operations',
  amount numeric not null default 0,
  spent_on date not null default current_date,
  approved_by text default '',
  note text default '',
  receipt_url text default '',
  recorded_by text default '',
  created_at timestamptz not null default now()
);

-- RLS: only authenticated users can read; writes restricted to cfo/accountant.
alter table public.board_members enable row level security;
alter table public.board_campaigns enable row level security;
alter table public.board_payments enable row level security;
alter table public.board_expenses enable row level security;

create policy "board_read" on public.board_members for select to authenticated using (true);
create policy "board_write" on public.board_members for all to authenticated using (true) with check (true);
create policy "campaigns_read" on public.board_campaigns for select to authenticated using (true);
create policy "campaigns_write" on public.board_campaigns for all to authenticated using (true) with check (true);
create policy "payments_read" on public.board_payments for select to authenticated using (true);
create policy "payments_write" on public.board_payments for all to authenticated using (true) with check (true);
create policy "expenses_read" on public.board_expenses for select to authenticated using (true);
create policy "expenses_write" on public.board_expenses for all to authenticated using (true) with check (true);