-- Enable RLS and policies for financing table
-- Make sure the table financing exists before applying this migration.

alter table if exists public.financing enable row level security;

-- Drop existing policies with same names to avoid duplication on re-run
do $$ begin
  if exists (select 1 from pg_policies where polname = 'Farmers see own financing') then
    execute 'drop policy "Farmers see own financing" on public.financing';
  end if;
  if exists (select 1 from pg_policies where polname = 'Admins see all financing') then
    execute 'drop policy "Admins see all financing" on public.financing';
  end if;
end $$;

create policy "Farmers see own financing"
  on public.financing
  for select
  using (farmer_id = auth.uid());

create policy "Admins see all financing"
  on public.financing
  for all
  using (
    exists (
      select 1 from public.users_profiles u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );
