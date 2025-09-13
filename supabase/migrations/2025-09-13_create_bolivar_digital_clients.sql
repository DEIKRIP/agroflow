-- Ensure pgcrypto or uuid extension for UUID generation
create extension if not exists "uuid-ossp";

-- Create bolivarDigitalClients table
create table if not exists public."bolivarDigitalClients" (
  id uuid primary key default uuid_generate_v4(),
  fullName text not null,
  cedula text not null,
  rif text,
  phone text,
  address text,
  activity text,
  farmerId uuid,
  createdAt timestamptz not null default timezone('utc'::text, now()),
  updatedAt timestamptz not null default timezone('utc'::text, now())
);

-- Helpful indexes
create index if not exists idx_bdc_fullName on public."bolivarDigitalClients"(fullName);
create index if not exists idx_bdc_cedula on public."bolivarDigitalClients"(cedula);

-- Enable RLS and basic policies (adjust to your auth model)
alter table public."bolivarDigitalClients" enable row level security;

create policy if not exists "bdc_select_auth"
  on public."bolivarDigitalClients"
  for select
  to authenticated
  using (true);

create policy if not exists "bdc_insert_auth"
  on public."bolivarDigitalClients"
  for insert
  to authenticated
  with check (true);

create policy if not exists "bdc_update_auth"
  on public."bolivarDigitalClients"
  for update
  to authenticated
  using (true)
  with check (true);

-- UpdatedAt trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$ language plpgsql;

create trigger bdc_set_updated_at
before update on public."bolivarDigitalClients"
for each row execute function public.set_updated_at();
