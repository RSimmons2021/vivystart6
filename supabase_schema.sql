-- Supabase SQL Schema for VivyStart6 App
-- Make sure to enable the uuid-ossp extension for uuid generation

-- Enable uuid-ossp extension (run this only once per database)
create extension if not exists "uuid-ossp";

-- USERS TABLE (sync with Supabase Auth)
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text unique,
  start_weight float,
  current_weight float,
  goal_weight float,
  height float,
  start_date date,
  target_date date
);

-- GOALS TABLE
create table if not exists goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  target_date date,
  is_completed boolean default false,
  progress integer default 0,
  created timestamp with time zone default now()
);

-- WEIGHT LOGS TABLE
create table if not exists weight_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  date date not null,
  weight float not null,
  notes text
);

-- SHOTS TABLE
create table if not exists shots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  date date not null,
  time time,
  type text,
  dose float,
  notes text
);

-- SIDE EFFECTS TABLE
create table if not exists side_effects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  date date not null,
  type text,
  severity integer,
  notes text
);

-- MEALS TABLE
create table if not exists meals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  date date not null,
  time time,
  name text,
  calories integer,
  carbs integer,
  protein integer,
  fat integer,
  is_saved boolean default false,
  notes text
);

-- WATER LOGS TABLE
create table if not exists water_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  date date not null,
  amount float not null,
  notes text
);

-- STEP LOGS TABLE
create table if not exists step_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  date date not null,
  count integer not null
);

-- ACHIEVEMENTS TABLE (optional)
create table if not exists achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  description text,
  icon text,
  is_unlocked boolean default false,
  unlocked_at timestamp,
  category text,
  points integer
);
