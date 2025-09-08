-- Fix inspections schema to align with app expectations
-- Current DB (from introspection):
-- public.inspections has: id uuid PK, fecha_inspeccion timestamptz, estado inspection_status,
-- farmer_cedula uuid (FK -> parcels.id) [WRONG], inspector_id uuid (FK -> user_profiles.id)
-- Goal:
-- - Add parcel_id uuid FK -> parcels.id
-- - Convert farmer_cedula to text and FK -> farmers.cedula
-- - Add status (text), priority (text), scheduled_at (timestamptz), metadata (jsonb), created_by (uuid), created_at, updated_at
-- - Maintain compatibility and backfill where possible

create extension if not exists pgcrypto;

DO $$
DECLARE
  has_wrong_fk boolean := false;
BEGIN
  -- 0) Detect and drop wrong FK on inspections.farmer_cedula -> parcels.id
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY (c.conkey)
    JOIN pg_class tr ON c.confrelid = tr.oid
    WHERE t.relname = 'inspections' AND a.attname = 'farmer_cedula' AND tr.relname = 'parcels'
  ) INTO has_wrong_fk;

  IF has_wrong_fk THEN
    ALTER TABLE public.inspections DROP CONSTRAINT IF EXISTS inspections_farmer_cedula_fkey;
  END IF;

  -- 1) Ensure parcel_id exists and backfill from wrong farmer_cedula when it's uuid
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='inspections' AND column_name='parcel_id'
  ) THEN
    ALTER TABLE public.inspections ADD COLUMN parcel_id uuid NULL;
    -- Backfill: if farmer_cedula column exists and is uuid-typed, copy values into parcel_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='inspections' AND column_name='farmer_cedula' AND data_type='uuid'
    ) THEN
      UPDATE public.inspections SET parcel_id = farmer_cedula WHERE parcel_id IS NULL;
    END IF;
  END IF;

  -- 2) Add proper FK from parcel_id -> parcels(id)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inspections_parcel_fk') THEN
    ALTER TABLE public.inspections
      ADD CONSTRAINT inspections_parcel_fk FOREIGN KEY (parcel_id) REFERENCES public.parcels(id) ON DELETE CASCADE;
  END IF;

  -- 3) Convert farmer_cedula to text and link to farmers.cedula
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inspections' AND column_name='farmer_cedula' AND data_type='uuid'
  ) THEN
    ALTER TABLE public.inspections ALTER COLUMN farmer_cedula TYPE text USING farmer_cedula::text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inspections_farmer_fk') THEN
    ALTER TABLE public.inspections
      ADD CONSTRAINT inspections_farmer_fk FOREIGN KEY (farmer_cedula) REFERENCES public.farmers(cedula) ON DELETE SET NULL;
  END IF;

  -- 4) Add new columns for production schema
  BEGIN ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS status text; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS priority text; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS scheduled_at timestamptz; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS metadata jsonb; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS created_by uuid; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS updated_at timestamptz; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS deleted_at timestamptz; EXCEPTION WHEN duplicate_column THEN NULL; END;

  -- 5) Defaults and backfill
  UPDATE public.inspections SET status = COALESCE(status, CASE WHEN estado IS NOT NULL THEN estado::text ELSE 'pendiente' END);
  UPDATE public.inspections SET priority = COALESCE(priority, 'media');
  UPDATE public.inspections SET scheduled_at = COALESCE(scheduled_at, fecha_inspeccion);
  UPDATE public.inspections SET metadata = COALESCE(metadata, '{}'::jsonb);

  BEGIN ALTER TABLE public.inspections ALTER COLUMN status SET DEFAULT 'pendiente'; EXCEPTION WHEN undefined_column THEN NULL; END;
  BEGIN ALTER TABLE public.inspections ALTER COLUMN priority SET DEFAULT 'media'; EXCEPTION WHEN undefined_column THEN NULL; END;
  BEGIN ALTER TABLE public.inspections ALTER COLUMN metadata SET DEFAULT '{}'::jsonb; EXCEPTION WHEN undefined_column THEN NULL; END;

  -- 6) Indexes
  CREATE INDEX IF NOT EXISTS idx_inspections_status_scheduled ON public.inspections (status, scheduled_at);
  CREATE INDEX IF NOT EXISTS idx_inspections_parcel ON public.inspections (parcel_id);
END$$;
