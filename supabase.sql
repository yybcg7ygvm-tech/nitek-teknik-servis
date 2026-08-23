-- NİTEK Teknik Servis - Supabase veritabanı
create extension if not exists pgcrypto;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text default '',
  address text default '',
  note text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  phone text default '',
  address text default '',
  type text not null,
  device text not null,
  brand text default '',
  model text default '',
  complaint text default '',
  done_checks jsonb not null default '[]'::jsonb,
  work text default '',
  parts_text text default '',
  labor numeric(12,2) not null default 0,
  parts numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  payment text default 'Ödenmedi',
  note text default '',
  service_date date not null default current_date,
  service_time time not null default current_time,
  created_at timestamptz not null default now()
);

create table if not exists public.user_brands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device text not null,
  brand text not null,
  model text not null,
  created_at timestamptz not null default now(),
  unique(user_id,device,brand,model)
);

create table if not exists public.user_maintenance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device text not null,
  item text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.customers enable row level security;
alter table public.services enable row level security;
alter table public.user_brands enable row level security;
alter table public.user_maintenance enable row level security;

drop policy if exists customers_owner on public.customers;
create policy customers_owner on public.customers for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

drop policy if exists services_owner on public.services;
create policy services_owner on public.services for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

drop policy if exists brands_owner on public.user_brands;
create policy brands_owner on public.user_brands for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

drop policy if exists maintenance_owner on public.user_maintenance;
create policy maintenance_owner on public.user_maintenance for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

create index if not exists customers_user_idx on public.customers(user_id);
create index if not exists services_user_idx on public.services(user_id);
create index if not exists services_customer_idx on public.services(customer_id);
