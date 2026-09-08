-- Migration: 011_districts_postcodes
-- Service-area postcode prefixes used by booking address validation.
-- The table may already exist in your project; this documents schema, seed, and SELECT access.

create table if not exists public.districts_postcodes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  postcode_prefixes text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.districts_postcodes
  (name, postcode_prefixes)
values
  ('Mill Hill', ARRAY['NW7']),
  ('West Finchley', ARRAY['N3']),
  ('East Finchley', ARRAY['N2']),
  ('Hampstead', ARRAY['NW3']),
  ('Woodside Park', ARRAY['N12'])
on conflict (name) do nothing;

-- Booking flow queries this table from the browser (anon key).
-- If RLS is enabled, allow public read of active rows (same openness as districts).
alter table public.districts_postcodes enable row level security;

drop policy if exists "Allow public read of active district postcodes"
  on public.districts_postcodes;

create policy "Allow public read of active district postcodes"
  on public.districts_postcodes
  for select
  to anon, authenticated
  using (is_active = true);
