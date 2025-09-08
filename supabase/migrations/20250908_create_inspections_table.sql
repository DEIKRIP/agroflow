-- Migration: Create/upgrade inspections table to production-ready schema
-- This migration is careful to preserve any existing data by upgrading the table in-place if it already exists.

-- Enable required extension for UUID generation
create extension if not exists pgcrypto;

-- Ensure referenced tables exist assumptions:
--   public.parcels(id bigint)
--   public.farmers(cedula text)
--   auth.users(id uuid)

-- If the inspections table already exists, upgrade it. Otherwise, create fresh with the full schema.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'inspections'
  ) THEN
    -- Add missing columns as per the target schema (one by one for compatibility)
    BEGIN
      ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS id_uuid uuid;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
    -- Ensure parcel_id exists with correct type (uuid). If existing type is not uuid, keep legacy.
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'inspections' AND column_name = 'parcel_id'
        AND data_type <> 'uuid'
    ) THEN
      ALTER TABLE public.inspections RENAME COLUMN parcel_id TO parcel_id_legacy;
    END IF;
    BEGIN
      ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS parcel_id uuid NULL;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN
      ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS farmer_cedula text NULL;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN
      ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS inspector_id uuid NULL;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN
      ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS status text;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN
      ALTER TABLE public.inspections ALTER COLUMN status SET DEFAULT 'pendiente';
    EXCEPTION WHEN undefined_column THEN NULL; END;
    BEGIN
      ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS priority text;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN
      ALTER TABLE public.inspections ALTER COLUMN priority SET DEFAULT 'media';
    EXCEPTION WHEN undefined_column THEN NULL; END;
    BEGIN
      ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS scheduled_at timestamptz NULL;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN
      ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS started_at timestamptz NULL;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN
      ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS completed_at timestamptz NULL;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN
      ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS metadata jsonb;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN
      ALTER TABLE public.inspections ALTER COLUMN metadata SET DEFAULT '{}';
    EXCEPTION WHEN undefined_column THEN NULL; END;
    BEGIN
      ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS created_by uuid NULL;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN
      ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS created_at timestamptz;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN
      ALTER TABLE public.inspections ALTER COLUMN created_at SET DEFAULT now();
    EXCEPTION WHEN undefined_column THEN NULL; END;
    BEGIN
      ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS updated_by uuid NULL;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN
      ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS updated_at timestamptz;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
    BEGIN
      ALTER TABLE public.inspections ALTER COLUMN updated_at SET DEFAULT now();
    EXCEPTION WHEN undefined_column THEN NULL; END;
    BEGIN
      ALTER TABLE public.inspections ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL;
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    -- Backfill new columns where possible
    UPDATE public.inspections SET status = COALESCE(status, 'pendiente');
    UPDATE public.inspections SET priority = COALESCE(priority, 'media');
    UPDATE public.inspections SET metadata = COALESCE(metadata, '{}');
    UPDATE public.inspections SET id_uuid = COALESCE(id_uuid, gen_random_uuid());

    -- If current PK is not UUID, migrate to UUID primary key
    IF EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public' AND t.relname = 'inspections' AND c.contype = 'p';

      IF FOUND THEN
        ALTER TABLE public.inspections DROP CONSTRAINT inspections_pkey;
      END IF;

      -- Rename current id to legacy_id and promote id_uuid as the new id
      ALTER TABLE public.inspections RENAME COLUMN id TO legacy_id;
      ALTER TABLE public.inspections RENAME COLUMN id_uuid TO id;
      ALTER TABLE public.inspections ADD PRIMARY KEY (id);
    ELSE
      -- If id already exists and is UUID but id_uuid was added, clean up
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'inspections' AND column_name = 'id_uuid'
      ) THEN
        ALTER TABLE public.inspections DROP COLUMN id_uuid;
      END IF;
    END IF;

    -- Add/ensure foreign keys and indexes by checking constraint names
    -- parcel_id -> parcels(id)
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'inspections_parcel_fk'
    ) THEN
      ALTER TABLE public.inspections
        ADD CONSTRAINT inspections_parcel_fk
        FOREIGN KEY (parcel_id) REFERENCES public.parcels(id) ON DELETE CASCADE;
    END IF;

    -- farmer_cedula -> farmers(cedula)
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'inspections_farmer_fk'
    ) THEN
      ALTER TABLE public.inspections
        ADD CONSTRAINT inspections_farmer_fk
        FOREIGN KEY (farmer_cedula) REFERENCES public.farmers(cedula) ON DELETE SET NULL;
    END IF;

    -- inspector_id -> auth.users(id)
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'inspections_inspector_fk'
    ) THEN
      ALTER TABLE public.inspections
        ADD CONSTRAINT inspections_inspector_fk
        FOREIGN KEY (inspector_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- created_by -> auth.users(id)
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'inspections_created_by_fk'
    ) THEN
      ALTER TABLE public.inspections
        ADD CONSTRAINT inspections_created_by_fk
        FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

  ELSE
    -- Fresh create with full target schema (id as UUID PK)
    CREATE TABLE public.inspections (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      parcel_id uuid NOT NULL REFERENCES public.parcels(id) ON DELETE CASCADE,
      farmer_cedula text NULL REFERENCES public.farmers(cedula) ON DELETE SET NULL,
      inspector_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
      status text NOT NULL DEFAULT 'pendiente',
      priority text NULL DEFAULT 'media',
      scheduled_at timestamptz NULL,
      started_at timestamptz NULL,
      completed_at timestamptz NULL,
      metadata jsonb NOT NULL DEFAULT '{}',
      created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_by uuid NULL,
      updated_at timestamptz NULL DEFAULT now(),
      deleted_at timestamptz NULL
    );
  END IF;
END$$;

-- Indexes required by spec
CREATE INDEX IF NOT EXISTS idx_inspections_status_scheduled ON public.inspections (status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_inspections_parcel ON public.inspections (parcel_id);

-- Optional: basic constraints to enforce allowed values (documented, not strict enums for flexibility)
DO $$
BEGIN
  -- Create a lightweight check if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'inspections_status_chk'
  ) THEN
    ALTER TABLE public.inspections
      ADD CONSTRAINT inspections_status_chk CHECK (status IN ('pendiente','programada','en_progreso','completada','cancelada'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'inspections_priority_chk'
  ) THEN
    ALTER TABLE public.inspections
      ADD CONSTRAINT inspections_priority_chk CHECK (priority IN ('baja','media','alta','urgente'));
  END IF;
END$$;

-- Touch updated_at on write
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_inspections_set_updated_at ON public.inspections;
CREATE TRIGGER trg_inspections_set_updated_at
BEFORE UPDATE ON public.inspections
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helpful RLS placeholders (disabled by default unless you enable RLS)
-- ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY inspections_select ON public.inspections FOR SELECT USING (created_by = auth.uid());
-- CREATE POLICY inspections_insert ON public.inspections FOR INSERT WITH CHECK (created_by = auth.uid());
