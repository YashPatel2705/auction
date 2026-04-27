-- ============================================================
--  CRICKET AUCTION — SUPABASE SCHEMA 

drop table if exists public.players cascade;

create table public.players (
  id          integer primary key,
  name        text        not null,
  role        text        not null check (role in ('Batter','Bowler','All-rounder','Wicket-keeper')),
  rating      integer     not null,
  status      text        not null default 'available' check (status in ('available','sold')),
  sold_to     text        default null,
  updated_at  timestamptz not null default now()
);

-- 2. Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_players_updated_at on public.players;
create trigger trg_players_updated_at
  before update on public.players
  for each row execute procedure public.set_updated_at();

-- 3. Enable Row Level Security
alter table public.players enable row level security;
alter table public.players replica identity full;

-- 4. RLS Policies
drop policy if exists "Allow public read"          on public.players;
drop policy if exists "Allow authenticated write"  on public.players;
drop policy if exists "Auth write players"         on public.players;

create policy "Allow public read"
  on public.players for select
  using (true);

create policy "Auth write players"
  on public.players for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 5. Enable Realtime
alter publication supabase_realtime add table public.players;