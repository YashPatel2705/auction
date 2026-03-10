-- ============================================================
--  CRICKET AUCTION — SUPABASE SCHEMA
--  Run this entire file in your Supabase SQL Editor
-- ============================================================

-- 1. PLAYERS TABLE
create table if not exists public.players (
  id            integer primary key,
  name          text        not null,
  role          text        not null check (role in ('Batter','Bowler','All-rounder','Wicket-keeper')),
  base_price    integer     not null,
  rating        integer     not null,
  status        text        not null default 'available' check (status in ('available','sold')),
  sold_to       text        default null,   -- team id e.g. 'MI', 'CSK'
  sold_price    integer     default null,
  updated_at    timestamptz not null default now()
);

-- 2. Auto-update updated_at on every row change
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
--    Everyone can READ players (viewers + admin)
create policy "Allow public read"
  on public.players for select
  using (true);

--    Only authenticated users (admin) can write
create policy "Allow authenticated write"
  on public.players for all
  using (auth.role() = 'authenticated');

-- 5. Enable Realtime on players table
--    (Go to Supabase Dashboard → Database → Replication and toggle ON for `players`)
--    Or run:
alter publication supabase_realtime add table public.players;

-- ============================================================
--  SEED DATA — 100 players
--  Run this ONCE after creating the table
-- ============================================================

insert into public.players (id, name, role, base_price, rating) values
  (1,  'Rohit Sharma',          'Batter',        200, 95),
  (2,  'Virat Kohli',           'Batter',        200, 97),
  (3,  'Babar Azam',            'Batter',        175, 94),
  (4,  'Steve Smith',           'Batter',        150, 91),
  (5,  'Kane Williamson',       'Batter',        150, 92),
  (6,  'Joe Root',              'Batter',        150, 93),
  (7,  'David Warner',          'Batter',        140, 90),
  (8,  'Shubman Gill',          'Batter',        130, 88),
  (9,  'Faf du Plessis',        'Batter',        120, 86),
  (10, 'KL Rahul',              'Batter',        130, 87),
  (11, 'Quinton de Kock',       'Batter',        120, 86),
  (12, 'Devon Conway',          'Batter',        110, 84),
  (13, 'Dawid Malan',           'Batter',        100, 82),
  (14, 'Fakhar Zaman',          'Batter',        100, 83),
  (15, 'Imam-ul-Haq',           'Batter',         90, 80),
  (16, 'Prithvi Shaw',          'Batter',         80, 78),
  (17, 'Ruturaj Gaikwad',       'Batter',        100, 84),
  (18, 'Ishan Kishan',          'Batter',         95, 82),
  (19, 'Sanju Samson',          'Batter',        100, 83),
  (20, 'Shreyas Iyer',          'Batter',        110, 85),
  (21, 'Ben Stokes',            'All-rounder',   180, 95),
  (22, 'Shakib Al Hasan',       'All-rounder',   140, 88),
  (23, 'Hardik Pandya',         'All-rounder',   150, 90),
  (24, 'Ravindra Jadeja',       'All-rounder',   160, 92),
  (25, 'Mitchell Marsh',        'All-rounder',   130, 87),
  (26, 'Glenn Maxwell',         'All-rounder',   140, 89),
  (27, 'Marcus Stoinis',        'All-rounder',   120, 85),
  (28, 'Moeen Ali',             'All-rounder',   110, 84),
  (29, 'Axar Patel',            'All-rounder',   110, 84),
  (30, 'Washington Sundar',     'All-rounder',    90, 80),
  (31, 'Venkatesh Iyer',        'All-rounder',    85, 79),
  (32, 'Shardul Thakur',        'All-rounder',    85, 79),
  (33, 'Vijay Shankar',         'All-rounder',    70, 75),
  (34, 'Liam Livingstone',      'All-rounder',   120, 86),
  (35, 'Sam Curran',            'All-rounder',   130, 87),
  (36, 'Jasprit Bumrah',        'Bowler',        200, 97),
  (37, 'Pat Cummins',           'Bowler',        190, 96),
  (38, 'Shaheen Afridi',        'Bowler',        170, 93),
  (39, 'Trent Boult',           'Bowler',        150, 90),
  (40, 'Kagiso Rabada',         'Bowler',        160, 91),
  (41, 'Mohammed Shami',        'Bowler',        150, 90),
  (42, 'Anrich Nortje',         'Bowler',        140, 88),
  (43, 'Mark Wood',             'Bowler',        130, 87),
  (44, 'Josh Hazlewood',        'Bowler',        130, 87),
  (45, 'Lockie Ferguson',       'Bowler',        110, 84),
  (46, 'Haris Rauf',            'Bowler',        110, 84),
  (47, 'Siraj Mohammed',        'Bowler',        100, 82),
  (48, 'Arshdeep Singh',        'Bowler',         90, 80),
  (49, 'Umran Malik',           'Bowler',         80, 78),
  (50, 'Prasidh Krishna',       'Bowler',         80, 77),
  (51, 'R Ashwin',              'Bowler',        150, 92),
  (52, 'Yuzvendra Chahal',      'Bowler',        130, 88),
  (53, 'Adam Zampa',            'Bowler',        120, 86),
  (54, 'Rashid Khan',           'Bowler',        180, 95),
  (55, 'Mujeeb ur Rahman',      'Bowler',        120, 85),
  (56, 'Tabraiz Shamsi',        'Bowler',        100, 82),
  (57, 'Kuldeep Yadav',         'Bowler',        100, 83),
  (58, 'Ish Sodhi',             'Bowler',         90, 80),
  (59, 'MS Dhoni',              'Wicket-keeper', 200, 94),
  (60, 'Jos Buttler',           'Wicket-keeper', 180, 95),
  (61, 'Rishabh Pant',          'Wicket-keeper', 160, 92),
  (62, 'Alex Carey',            'Wicket-keeper', 120, 85),
  (63, 'Nicholas Pooran',       'Wicket-keeper', 130, 87),
  (64, 'Heinrich Klaasen',      'Wicket-keeper', 120, 85),
  (65, 'Phil Salt',             'Wicket-keeper', 110, 83),
  (66, 'Chris Gayle',           'Batter',        110, 82),
  (67, 'Kieron Pollard',        'All-rounder',   120, 84),
  (68, 'Andre Russell',         'All-rounder',   160, 91),
  (69, 'Sunil Narine',          'All-rounder',   130, 87),
  (70, 'Jason Holder',          'All-rounder',   120, 85),
  (71, 'Kyle Mayers',           'All-rounder',   100, 82),
  (72, 'Shimron Hetmyer',       'Batter',        110, 83),
  (73, 'Rovman Powell',         'Batter',         90, 80),
  (74, 'Najibullah Zadran',     'Batter',         80, 78),
  (75, 'Mohammad Nabi',         'All-rounder',   110, 83),
  (76, 'Aiden Markram',         'All-rounder',   110, 83),
  (77, 'David Miller',          'Batter',        120, 85),
  (78, 'Rassie van der Dussen', 'Batter',        110, 83),
  (79, 'Daryl Mitchell',        'All-rounder',   100, 82),
  (80, 'Martin Guptill',        'Batter',         90, 80),
  (81, 'Mitchell Santner',      'All-rounder',   100, 82),
  (82, 'Tim Southee',           'Bowler',        110, 83),
  (83, 'Matt Henry',            'Bowler',         90, 79),
  (84, 'Reece Topley',          'Bowler',         90, 79),
  (85, 'Chris Jordan',          'Bowler',         85, 78),
  (86, 'Tymal Mills',           'Bowler',         80, 77),
  (87, 'Liam Dawson',           'All-rounder',    75, 75),
  (88, 'Colin Munro',           'Batter',         85, 78),
  (89, 'Tim Seifert',           'Wicket-keeper',  80, 76),
  (90, 'Dinesh Karthik',        'Wicket-keeper',  90, 79),
  (91, 'Wriddhiman Saha',       'Wicket-keeper',  80, 77),
  (92, 'Deepak Chahar',         'Bowler',        100, 82),
  (93, 'Bhuvneshwar Kumar',     'Bowler',        110, 83),
  (94, 'T Natarajan',           'Bowler',         80, 77),
  (95, 'Varun Chakravarthy',    'Bowler',         85, 78),
  (96, 'Ravi Bishnoi',          'Bowler',         85, 78),
  (97, 'Avesh Khan',            'Bowler',         80, 77),
  (98, 'Rahul Chahar',          'Bowler',         80, 77),
  (99, 'Devdutt Padikkal',      'Batter',         85, 78),
  (100,'Abhishek Sharma',       'All-rounder',    75, 76)
on conflict (id) do nothing;
