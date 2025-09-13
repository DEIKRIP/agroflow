-- Migration: create_inspection_v2 RPC
-- Description: Creates inspections with server-side validations, deduping and parcel snapshot
-- Note: Ensure parcels.is_active (boolean) exists or adjust validation accordingly.

create or replace function create_inspection_v2(
  p_parcel_id uuid,
  p_notes text default null
)
returns inspections as $$
declare
  v_inspection inspections;
begin
  -- Validate parcel exists and is active
  if not exists (
    select 1 from parcels
    where id = p_parcel_id
      and is_active = true
  ) then
    raise exception 'Parcela no válida o inactiva';
  end if;

  -- Deduplicate open inspections for the parcel
  if exists (
    select 1 from inspections
    where parcel_id = p_parcel_id
      and status in ('pendiente','programada','en_progreso')
  ) then
    raise exception 'Ya existe una inspección activa para esta parcela';
  end if;

  -- Create inspection with snapshot metadata
  insert into inspections (parcel_id, status, notes, metadata)
  values (
    p_parcel_id,
    'pendiente',
    p_notes,
    jsonb_build_object(
      'snapshot', (select row_to_json(p) from parcels p where p.id = p_parcel_id)
    )
  )
  returning * into v_inspection;

  return v_inspection;
end;
$$ language plpgsql security definer;
