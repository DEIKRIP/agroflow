-- Migration: Identity fields and recovery support
-- 1) Add identity columns and relationships
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS farmer_cedula TEXT UNIQUE REFERENCES public.farmers(cedula) ON DELETE SET NULL;

-- Ensure farmers has identity fields required for recovery
ALTER TABLE public.farmers
  ADD COLUMN IF NOT EXISTS document_type TEXT,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD CONSTRAINT unique_farmers_email UNIQUE (email);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_farmers_birth_date ON public.farmers(birth_date);
CREATE INDEX IF NOT EXISTS idx_farmers_document ON public.farmers(document_type, cedula);
CREATE INDEX IF NOT EXISTS idx_user_profiles_farmer ON public.user_profiles(farmer_cedula);

-- 2) Backfill: try to link user_profiles to farmers by matching email when possible
UPDATE public.user_profiles up
SET farmer_cedula = f.cedula
FROM public.farmers f
WHERE up.email = f.email AND up.farmer_cedula IS NULL;

-- 3) Comments to document recovery flow
COMMENT ON COLUMN public.farmers.document_type IS 'Tipo de documento (V, E, J, PAS, etc.)';
COMMENT ON COLUMN public.farmers.birth_date IS 'Fecha de nacimiento del agricultor';
COMMENT ON COLUMN public.user_profiles.farmer_cedula IS 'Referencia al agricultor (farmers.cedula) para validar identidad y asociar información';
