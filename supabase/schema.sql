-- ============================================================
--  CRICKET AUCTION — SUPABASE SCHEMA (No Pricing)
--  Run this entire file in your Supabase SQL Editor
-- ============================================================

-- 1. Drop old table if exists and recreate clean
drop table if exists public.players;

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

-- 4. RLS Policies
create policy "Allow public read"
  on public.players for select
  using (true);

create policy "Allow authenticated write"
  on public.players for all
  using (auth.role() = 'authenticated');

-- 5. Enable Realtime
alter publication supabase_realtime add table public.players;

-- ============================================================
--  SEED DATA — 100 players (no prices)
-- ============================================================

insert into public.players (id, name, role, rating) values
  (1,  'Rohit Sharma',          'Batter',        95),
  (2,  'Virat Kohli',           'Batter',        97),
  (3,  'Babar Azam',            'Batter',        94),
  (4,  'Steve Smith',           'Batter',        91),
  (5,  'Kane Williamson',       'Batter',        92),
  (6,  'Joe Root',              'Batter',        93),
  (7,  'David Warner',          'Batter',        90),
  (8,  'Shubman Gill',          'Batter',        88),
  (9,  'Faf du Plessis',        'Batter',        86),
  (10, 'KL Rahul',              'Batter',        87),
  (11, 'Quinton de Kock',       'Batter',        86),
  (12, 'Devon Conway',          'Batter',        84),
  (13, 'Dawid Malan',           'Batter',        82),
  (14, 'Fakhar Zaman',          'Batter',        83),
  (15, 'Imam-ul-Haq',           'Batter',        80),
  (16, 'Prithvi Shaw',          'Batter',        78),
  (17, 'Ruturaj Gaikwad',       'Batter',        84),
  (18, 'Ishan Kishan',          'Batter',        82),
  (19, 'Sanju Samson',          'Batter',        83),
  (20, 'Shreyas Iyer',          'Batter',        85),
  (21, 'Ben Stokes',            'All-rounder',   95),
  (22, 'Shakib Al Hasan',       'All-rounder',   88),
  (23, 'Hardik Pandya',         'All-rounder',   90),
  (24, 'Ravindra Jadeja',       'All-rounder',   92),
  (25, 'Mitchell Marsh',        'All-rounder',   87),
  (26, 'Glenn Maxwell',         'All-rounder',   89),
  (27, 'Marcus Stoinis',        'All-rounder',   85),
  (28, 'Moeen Ali',             'All-rounder',   84),
  (29, 'Axar Patel',            'All-rounder',   84),
  (30, 'Washington Sundar',     'All-rounder',   80),
  (31, 'Venkatesh Iyer',        'All-rounder',   79),
  (32, 'Shardul Thakur',        'All-rounder',   79),
  (33, 'Vijay Shankar',         'All-rounder',   75),
  (34, 'Liam Livingstone',      'All-rounder',   86),
  (35, 'Sam Curran',            'All-rounder',   87),
  (36, 'Jasprit Bumrah',        'Bowler',        97),
  (37, 'Pat Cummins',           'Bowler',        96),
  (38, 'Shaheen Afridi',        'Bowler',        93),
  (39, 'Trent Boult',           'Bowler',        90),
  (40, 'Kagiso Rabada',         'Bowler',        91),
  (41, 'Mohammed Shami',        'Bowler',        90),
  (42, 'Anrich Nortje',         'Bowler',        88),
  (43, 'Mark Wood',             'Bowler',        87),
  (44, 'Josh Hazlewood',        'Bowler',        87),
  (45, 'Lockie Ferguson',       'Bowler',        84),
  (46, 'Haris Rauf',            'Bowler',        84),
  (47, 'Siraj Mohammed',        'Bowler',        82),
  (48, 'Arshdeep Singh',        'Bowler',        80),
  (49, 'Umran Malik',           'Bowler',        78),
  (50, 'Prasidh Krishna',       'Bowler',        77),
  (51, 'R Ashwin',              'Bowler',        92),
  (52, 'Yuzvendra Chahal',      'Bowler',        88),
  (53, 'Adam Zampa',            'Bowler',        86),
  (54, 'Rashid Khan',           'Bowler',        95),
  (55, 'Mujeeb ur Rahman',      'Bowler',        85),
  (56, 'Tabraiz Shamsi',        'Bowler',        82),
  (57, 'Kuldeep Yadav',         'Bowler',        83),
  (58, 'Ish Sodhi',             'Bowler',        80),
  (59, 'MS Dhoni',              'Wicket-keeper', 94),
  (60, 'Jos Buttler',           'Wicket-keeper', 95),
  (61, 'Rishabh Pant',          'Wicket-keeper', 92),
  (62, 'Alex Carey',            'Wicket-keeper', 85),
  (63, 'Nicholas Pooran',       'Wicket-keeper', 87),
  (64, 'Heinrich Klaasen',      'Wicket-keeper', 85),
  (65, 'Phil Salt',             'Wicket-keeper', 83),
  (66, 'Chris Gayle',           'Batter',        82),
  (67, 'Kieron Pollard',        'All-rounder',   84),
  (68, 'Andre Russell',         'All-rounder',   91),
  (69, 'Sunil Narine',          'All-rounder',   87),
  (70, 'Jason Holder',          'All-rounder',   85),
  (71, 'Kyle Mayers',           'All-rounder',   82),
  (72, 'Shimron Hetmyer',       'Batter',        83),
  (73, 'Rovman Powell',         'Batter',        80),
  (74, 'Najibullah Zadran',     'Batter',        78),
  (75, 'Mohammad Nabi',         'All-rounder',   83),
  (76, 'Aiden Markram',         'All-rounder',   83),
  (77, 'David Miller',          'Batter',        85),
  (78, 'Rassie van der Dussen', 'Batter',        83),
  (79, 'Daryl Mitchell',        'All-rounder',   82),
  (80, 'Martin Guptill',        'Batter',        80),
  (81, 'Mitchell Santner',      'All-rounder',   82),
  (82, 'Tim Southee',           'Bowler',        83),
  (83, 'Matt Henry',            'Bowler',        79),
  (84, 'Reece Topley',          'Bowler',        79),
  (85, 'Chris Jordan',          'Bowler',        78),
  (86, 'Tymal Mills',           'Bowler',        77),
  (87, 'Liam Dawson',           'All-rounder',   75),
  (88, 'Colin Munro',           'Batter',        78),
  (89, 'Tim Seifert',           'Wicket-keeper', 76),
  (90, 'Dinesh Karthik',        'Wicket-keeper', 79),
  (91, 'Wriddhiman Saha',       'Wicket-keeper', 77),
  (92, 'Deepak Chahar',         'Bowler',        82),
  (93, 'Bhuvneshwar Kumar',     'Bowler',        83),
  (94, 'T Natarajan',           'Bowler',        77),
  (95, 'Varun Chakravarthy',    'Bowler',        78),
  (96, 'Ravi Bishnoi',          'Bowler',        78),
  (97, 'Avesh Khan',            'Bowler',        77),
  (98, 'Rahul Chahar',          'Bowler',        77),
  (99, 'Devdutt Padikkal',      'Batter',        78),
  (100,'Abhishek Sharma',       'All-rounder',   76)
on conflict (id) do nothing;
