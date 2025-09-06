-- Parcels: asegurar user_id y relaciones
alter table if exists public.parcels
  add column if not exists user_id uuid not null references auth.users(id) on delete cascade,
  add column if not exists farmer_cedula text null,
  add column if not exists created_at timestamptz not null default now();

create index if not exists idx_parcels_user_id on public.parcels(user_id);
create index if not exists idx_parcels_farmer_cedula on public.parcels(farmer_cedula);

alter table public.parcels enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'parcels' and policyname = 'parcels_select_own_or_admin') then
    create policy parcels_select_own_or_admin
      on public.parcels
      for select
      using (
        user_id = auth.uid()
        or exists (
          select 1 from public.user_profiles up
          where up.id = auth.uid() and up.role in ('admin','operador')
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'parcels' and policyname = 'parcels_insert_self') then
    create policy parcels_insert_self
      on public.parcels
      for insert
      with check (
        user_id = auth.uid()
        or exists (
          select 1 from public.user_profiles up
          where up.id = auth.uid() and up.role in ('admin','operador')
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'parcels' and policyname = 'parcels_update_own_or_admin') then
    create policy parcels_update_own_or_admin
      on public.parcels
      for update
      using (
        user_id = auth.uid()
        or exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role in ('admin','operador'))
      )
      with check (
        user_id = auth.uid()
        or exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role in ('admin','operador'))
      );
  end if;
end $$;

-- Inspections: ligar a parcela y autor
create table if not exists public.inspections (
  id bigint generated always as identity primary key,
  parcel_id bigint not null references public.parcels(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_inspections_parcel on public.inspections(parcel_id);
create index if not exists idx_inspections_created_by on public.inspections(created_by);
alter table public.inspections enable row level security;

create policy if not exists inspections_select on public.inspections
  for select
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.user_profiles up where up.id = auth.uid() and up.role in ('admin','operador')
    )
    or exists (
      select 1 from public.parcels p where p.id = inspections.parcel_id and p.user_id = auth.uid()
    )
  );

create policy if not exists inspections_insert on public.inspections
  for insert
  with check (
    created_by = auth.uid()
    or exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role in ('admin','operador'))
  );

create policy if not exists inspections_update on public.inspections
  for update
  using (
    created_by = auth.uid()
    or exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role in ('admin','operador'))
  )
  with check (
    created_by = auth.uid()
    or exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role in ('admin','operador'))
  );

-- Financing: ligar a farmer y user
create table if not exists public.financing (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  farmer_cedula text null,
  amount numeric(14,2) not null default 0,
  status text not null default 'requested',
  requested_at timestamptz not null default now()
);

create index if not exists idx_financing_user on public.financing(user_id);
create index if not exists idx_financing_farmer on public.financing(farmer_cedula);
alter table public.financing enable row level security;

create policy if not exists financing_select on public.financing
  for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role in ('admin','operador'))
  );

create policy if not exists financing_insert_self on public.financing
  for insert
  with check (
    user_id = auth.uid()
    or exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role in ('admin','operador'))
  );

create policy if not exists financing_update_admin on public.financing
  for update
  using (
    exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role in ('admin','operador'))
  )
  with check (
    exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role in ('admin','operador'))
  );

-- Productive subjects: creado al aprobar
create table if not exists public.productive_subjects (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  farmer_cedula text null,
  financing_id bigint not null references public.financing(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (financing_id)
);
create index if not exists idx_prod_subjects_user on public.productive_subjects(user_id);

alter table public.productive_subjects enable row level security;

create policy if not exists prod_subjects_select on public.productive_subjects
  for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.user_profiles up where up.id = auth.uid() and up.role in ('admin','operador'))
  );

-- Trigger que crea productive_subject en aprobación
create or replace function public.fn_on_financing_approved()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'approved' then
    insert into public.productive_subjects (user_id, farmer_cedula, financing_id)
    values (new.user_id, new.farmer_cedula, new.id)
    on conflict (financing_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_financing_approved on public.financing;
create trigger trg_financing_approved
after update of status on public.financing
for each row
when (new.status = 'approved' and old.status is distinct from new.status)
execute function public.fn_on_financing_approved();
