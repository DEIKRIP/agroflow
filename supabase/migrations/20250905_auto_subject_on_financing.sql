-- Auto-create productive_subjects when a financing is approved
-- 1) Ensure uniqueness to prevent duplicates
ALTER TABLE public.productive_subjects
  ADD CONSTRAINT IF NOT EXISTS uq_productive_subjects_farmer UNIQUE (farmer_cedula);

-- 2) Function: when a financing changes state to 'aprobado', insert productive_subject
CREATE OR REPLACE FUNCTION public.auto_subject_on_financing()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.estado = 'aprobado' THEN
    INSERT INTO public.productive_subjects (farmer_cedula, estado_programa, observaciones)
    VALUES (NEW.farmer_cedula, 'activo', 'Alta automática por financiamiento aprobado')
    ON CONFLICT (farmer_cedula) DO NOTHING;

    -- Log activity for visibility in ActivityTimeline
    PERFORM public.log_activity('productive_subject', NEW.farmer_cedula, 'created', jsonb_build_object('source', 'financing', 'financing_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$;

-- 3) Trigger on financings
DROP TRIGGER IF EXISTS trg_financing_subject ON public.financings;
CREATE TRIGGER trg_financing_subject
  AFTER UPDATE ON public.financings
  FOR EACH ROW
  WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
  EXECUTE FUNCTION public.auto_subject_on_financing();
