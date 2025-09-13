-- ======================================================================
-- SCHEMA OPTIMIZATIONS: FKs with ON DELETE CASCADE + Useful Indexes
-- Adjust constraint names if your current FK names differ.
-- ======================================================================

-- 1) farmers: índices útiles
CREATE INDEX IF NOT EXISTS idx_farmers_user_id ON public.farmers (user_id);
CREATE INDEX IF NOT EXISTS idx_farmers_email ON public.farmers (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_farmers_cedula ON public.farmers (cedula);

-- 2) parcels: FK -> farmers(id) con ON DELETE CASCADE + índices
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='parcels' AND column_name='farmer_id'
  ) THEN
    -- Drop FK si existe (ajusta el nombre si difiere)
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_schema='public' AND table_name='parcels' AND constraint_name='parcels_farmer_id_fkey'
    ) THEN
      ALTER TABLE public.parcels DROP CONSTRAINT parcels_farmer_id_fkey;
    END IF;

    ALTER TABLE public.parcels
      ADD CONSTRAINT parcels_farmer_id_fkey
      FOREIGN KEY (farmer_id) REFERENCES public.farmers (id)
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_parcels_farmer_id ON public.parcels (farmer_id);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON public.parcels (status);

-- 3) inspections: FKs -> farmers(id), parcels(id) con ON DELETE CASCADE + índices
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='inspections' AND column_name='farmer_id'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_schema='public' AND table_name='inspections' AND constraint_name='inspections_farmer_id_fkey'
    ) THEN
      ALTER TABLE public.inspections DROP CONSTRAINT inspections_farmer_id_fkey;
    END IF;

    ALTER TABLE public.inspections
      ADD CONSTRAINT inspections_farmer_id_fkey
      FOREIGN KEY (farmer_id) REFERENCES public.farmers (id)
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='inspections' AND column_name='parcel_id'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_schema='public' AND table_name='inspections' AND constraint_name='inspections_parcel_id_fkey'
    ) THEN
      ALTER TABLE public.inspections DROP CONSTRAINT inspections_parcel_id_fkey;
    END IF;

    ALTER TABLE public.inspections
      ADD CONSTRAINT inspections_parcel_id_fkey
      FOREIGN KEY (parcel_id) REFERENCES public.parcels (id)
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_inspections_farmer_id ON public.inspections (farmer_id);
CREATE INDEX IF NOT EXISTS idx_inspections_parcel_id ON public.inspections (parcel_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON public.inspections (status);
CREATE INDEX IF NOT EXISTS idx_inspections_created_at ON public.inspections (created_at);

-- 4) financing: FKs -> farmers(id), parcels(id) con ON DELETE CASCADE + índices
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='financing' AND column_name='farmer_id'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_schema='public' AND table_name='financing' AND constraint_name='financing_farmer_id_fkey'
    ) THEN
      ALTER TABLE public.financing DROP CONSTRAINT financing_farmer_id_fkey;
    END IF;

    ALTER TABLE public.financing
      ADD CONSTRAINT financing_farmer_id_fkey
      FOREIGN KEY (farmer_id) REFERENCES public.farmers (id)
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='financing' AND column_name='parcel_id'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_schema='public' AND table_name='financing' AND constraint_name='financing_parcel_id_fkey'
    ) THEN
      ALTER TABLE public.financing DROP CONSTRAINT financing_parcel_id_fkey;
    END IF;

    ALTER TABLE public.financing
      ADD CONSTRAINT financing_parcel_id_fkey
      FOREIGN KEY (parcel_id) REFERENCES public.parcels (id)
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_financing_farmer_id ON public.financing (farmer_id);
CREATE INDEX IF NOT EXISTS idx_financing_parcel_id ON public.financing (parcel_id);
CREATE INDEX IF NOT EXISTS idx_financing_status ON public.financing (status);
CREATE INDEX IF NOT EXISTS idx_financing_approved_amount ON public.financing (approved_amount);

-- 5) payments (si existe): FK -> financing(id) con ON DELETE CASCADE + índices
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='payments'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_schema='public' AND table_name='payments' AND constraint_name='payments_financing_id_fkey'
    ) THEN
      ALTER TABLE public.payments DROP CONSTRAINT payments_financing_id_fkey;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='payments' AND column_name='financing_id'
    ) THEN
      ALTER TABLE public.payments
        ADD CONSTRAINT payments_financing_id_fkey
        FOREIGN KEY (financing_id) REFERENCES public.financing (id)
        ON UPDATE CASCADE ON DELETE CASCADE;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_payments_financing_id ON public.payments (financing_id);
    CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments (created_at);
  END IF;
END$$;

-- 6) notifications (si aplica): índice por usuario/estado/fecha
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='notifications'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_is_read_created_at ON public.notifications (is_read, created_at);
  END IF;
END$$;
