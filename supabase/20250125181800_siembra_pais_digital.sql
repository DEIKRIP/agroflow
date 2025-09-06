-- Siembra País Digital - Comprehensive Agricultural Platform
-- Schema Analysis: Fresh project implementation
-- Integration Type: Complete new schema
-- Dependencies: Auth system integration

-- 1. Custom Types
CREATE TYPE public.user_role AS ENUM ('admin', 'operador', 'productor');
CREATE TYPE public.financing_status AS ENUM ('solicitado', 'aprobado', 'rechazado', 'activo', 'pagado');
CREATE TYPE public.inspection_status AS ENUM ('pendiente', 'aprobada', 'rechazada');
CREATE TYPE public.risk_level AS ENUM ('bajo', 'medio', 'alto');
CREATE TYPE public.soil_type AS ENUM ('arcilloso', 'arenoso', 'limoso', 'franco', 'humifero');
CREATE TYPE public.crop_type AS ENUM ('maiz', 'arroz', 'frijol', 'yuca', 'platano', 'cafe', 'cacao', 'tomate', 'papa', 'cebolla');

-- 2. Core Tables

-- Create sequences for display IDs
CREATE SEQUENCE public.farmers_display_id_seq START 1;
CREATE SEQUENCE public.parcels_display_id_seq START 1;
CREATE SEQUENCE public.inspections_display_id_seq START 1;
CREATE SEQUENCE public.financings_display_id_seq START 1;

-- User profiles (intermediary for auth)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role public.user_role DEFAULT 'productor'::public.user_role,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Farmers (main entity)
CREATE TABLE public.farmers (
    cedula TEXT PRIMARY KEY, -- Using cedula as unique identifier
    display_id INTEGER NOT NULL DEFAULT nextval('farmers_display_id_seq'),
    nombre_completo TEXT NOT NULL,
    rif TEXT,
    email TEXT,
    telefono TEXT,
    risk public.risk_level DEFAULT 'medio'::public.risk_level,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Parcels (subcolection of farmers)
CREATE TABLE public.parcels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_id INTEGER NOT NULL DEFAULT nextval('parcels_display_id_seq'),
    farmer_cedula TEXT REFERENCES public.farmers(cedula) ON DELETE CASCADE,
    ubicacion_lat DECIMAL(10, 8),
    ubicacion_lng DECIMAL(11, 8),
    tipo_suelo public.soil_type DEFAULT 'franco'::public.soil_type,
    area_hectareas DECIMAL(8, 2) NOT NULL,
    cultivo_principal public.crop_type NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Inspections
CREATE TABLE public.inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_id INTEGER NOT NULL DEFAULT nextval('inspections_display_id_seq'),
    parcel_id UUID REFERENCES public.parcels(id) ON DELETE CASCADE,
    inspector_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    fecha_inspeccion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    estado public.inspection_status DEFAULT 'pendiente'::public.inspection_status,
    observaciones TEXT,
    recomendaciones TEXT,
    calificacion_calidad INTEGER CHECK (calificacion_calidad >= 1 AND calificacion_calidad <= 10),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Financings (central registry)
CREATE TABLE public.financings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_id INTEGER NOT NULL DEFAULT nextval('financings_display_id_seq'),
    farmer_cedula TEXT REFERENCES public.farmers(cedula) ON DELETE CASCADE,
    monto_solicitado DECIMAL(12, 2) NOT NULL,
    monto_aprobado DECIMAL(12, 2),
    proposito TEXT NOT NULL,
    estado public.financing_status DEFAULT 'solicitado'::public.financing_status,
    nivel_riesgo public.risk_level,
    numero_cuotas INTEGER,
    tasa_interes DECIMAL(5, 2),
    fecha_solicitud TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    fecha_aprobacion TIMESTAMPTZ,
    condiciones_especiales TEXT,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Productive Subjects (mirror of farmers for financial program)
CREATE TABLE public.productive_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_cedula TEXT REFERENCES public.farmers(cedula) ON DELETE CASCADE,
    fecha_ingreso TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    estado_programa TEXT DEFAULT 'activo',
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Activity Log for traceability
CREATE TABLE public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- 'farmer', 'parcel', 'inspection', 'financing'
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'created', 'updated', 'approved', 'rejected'
    details JSONB,
    performed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Essential Indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_farmers_cedula ON public.farmers(cedula);
CREATE INDEX idx_farmers_risk ON public.farmers(risk);
CREATE INDEX idx_parcels_farmer_cedula ON public.parcels(farmer_cedula);
CREATE INDEX idx_parcels_cultivo ON public.parcels(cultivo_principal);
CREATE INDEX idx_inspections_parcel_id ON public.inspections(parcel_id);
CREATE INDEX idx_inspections_inspector_id ON public.inspections(inspector_id);
CREATE INDEX idx_inspections_estado ON public.inspections(estado);
CREATE INDEX idx_financings_farmer_cedula ON public.financings(farmer_cedula);
CREATE INDEX idx_financings_estado ON public.financings(estado);
CREATE INDEX idx_activity_log_entity ON public.activity_log(entity_type, entity_id);

-- 4. RLS Setup
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productive_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- 5. Helper Functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role = 'admin'
)
$$;

CREATE OR REPLACE FUNCTION public.is_operator_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role IN ('admin', 'operador')
)
$$;

CREATE OR REPLACE FUNCTION public.can_access_farmer(farmer_cedula_param TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() 
    AND (up.role IN ('admin', 'operador') OR up.email = (
        SELECT f.email FROM public.farmers f WHERE f.cedula = farmer_cedula_param
    ))
)
$$;

CREATE OR REPLACE FUNCTION public.can_manage_financing(financing_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.financings fi
    JOIN public.user_profiles up ON up.id = auth.uid()
    WHERE fi.id = financing_uuid
    AND (up.role IN ('admin', 'operador') OR fi.created_by = auth.uid())
)
$$;

-- Function for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'productor')::public.user_role
  );  
  RETURN NEW;
END;
$$;

-- Function to log activities
CREATE OR REPLACE FUNCTION public.log_activity(
    p_entity_type TEXT,
    p_entity_id TEXT,
    p_action TEXT,
    p_details JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.activity_log (entity_type, entity_id, action, details, performed_by)
    VALUES (p_entity_type, p_entity_id, p_action, p_details, auth.uid());
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. RLS Policies

-- User profiles - users can view and edit their own profile, admins can view all
CREATE POLICY "users_own_profile" ON public.user_profiles
FOR ALL TO authenticated
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

-- Farmers - operators and admins can manage, farmers can view their own data
CREATE POLICY "farmers_access_control" ON public.farmers
FOR SELECT TO authenticated
USING (public.is_operator_or_admin() OR public.can_access_farmer(cedula));

CREATE POLICY "farmers_manage_control" ON public.farmers
FOR INSERT TO authenticated
WITH CHECK (public.is_operator_or_admin());

CREATE POLICY "farmers_update_control" ON public.farmers
FOR UPDATE TO authenticated
USING (public.is_operator_or_admin())
WITH CHECK (public.is_operator_or_admin());

-- Parcels - follow farmer access patterns
CREATE POLICY "parcels_access_control" ON public.parcels
FOR SELECT TO authenticated
USING (public.is_operator_or_admin() OR public.can_access_farmer(farmer_cedula));

CREATE POLICY "parcels_manage_control" ON public.parcels
FOR ALL TO authenticated
USING (public.is_operator_or_admin())
WITH CHECK (public.is_operator_or_admin());

-- Inspections - inspectors can manage their own inspections
CREATE POLICY "inspections_access_control" ON public.inspections
FOR SELECT TO authenticated
USING (public.is_operator_or_admin() OR inspector_id = auth.uid());

CREATE POLICY "inspections_manage_control" ON public.inspections
FOR ALL TO authenticated
USING (public.is_operator_or_admin())
WITH CHECK (public.is_operator_or_admin());

-- Financings - restricted access based on role and ownership
CREATE POLICY "financings_access_control" ON public.financings
FOR SELECT TO authenticated
USING (public.can_manage_financing(id));

CREATE POLICY "financings_manage_control" ON public.financings
FOR ALL TO authenticated
USING (public.can_manage_financing(id))
WITH CHECK (public.can_manage_financing(id));

-- Productive subjects - admin and operators only
CREATE POLICY "productive_subjects_control" ON public.productive_subjects
FOR ALL TO authenticated
USING (public.is_operator_or_admin())
WITH CHECK (public.is_operator_or_admin());

-- Activity log - read access for operators and admins
CREATE POLICY "activity_log_read" ON public.activity_log
FOR SELECT TO authenticated
USING (public.is_operator_or_admin());

CREATE POLICY "activity_log_insert" ON public.activity_log
FOR INSERT TO authenticated
WITH CHECK (performed_by = auth.uid());

-- 7. Mock Data
DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
    operador_uuid UUID := gen_random_uuid();
    productor_uuid UUID := gen_random_uuid();
    farmer1_cedula TEXT := '12345678';
    farmer2_cedula TEXT := '87654321';
    parcel1_uuid UUID := gen_random_uuid();
    parcel2_uuid UUID := gen_random_uuid();
    financing1_uuid UUID := gen_random_uuid();
BEGIN
    -- Create auth users with required fields
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin@siembrapais.gov.ve', crypt('Admin123!', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Administrador del Sistema", "role": "admin"}'::jsonb, 
         '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (operador_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'operador@siembrapais.gov.ve', crypt('Operador123!', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "María González - Operadora", "role": "operador"}'::jsonb, 
         '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (productor_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'productor@ejemplo.com', crypt('Productor123!', gen_salt('bf', 10)), now(), now(), now(),
         '{"full_name": "Carlos Pérez - Productor", "role": "productor"}'::jsonb, 
         '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null);

    -- Create farmers
    INSERT INTO public.farmers (cedula, nombre_completo, rif, email, telefono, risk, created_by)
    VALUES
        (farmer1_cedula, 'Carlos Enrique Pérez Rodríguez', 'J-12345678-9', 'productor@ejemplo.com', '+58-412-1234567', 'bajo'::public.risk_level, operador_uuid),
        (farmer2_cedula, 'Ana María Fernández López', 'J-87654321-0', 'ana.fernandez@ejemplo.com', '+58-414-7654321', 'medio'::public.risk_level, operador_uuid);

    -- Create parcels
    INSERT INTO public.parcels (id, farmer_cedula, ubicacion_lat, ubicacion_lng, tipo_suelo, area_hectareas, cultivo_principal, descripcion)
    VALUES
        (parcel1_uuid, farmer1_cedula, 10.4806, -66.9036, 'franco'::public.soil_type, 5.5, 'maiz'::public.crop_type, 'Parcela principal para cultivo de maíz amarillo'),
        (parcel2_uuid, farmer2_cedula, 10.4906, -66.8936, 'arcilloso'::public.soil_type, 3.2, 'arroz'::public.crop_type, 'Terreno ideal para arroz con sistema de riego');

    -- Create inspections
    INSERT INTO public.inspections (parcel_id, inspector_id, estado, observaciones, recomendaciones, calificacion_calidad)
    VALUES
        (parcel1_uuid, operador_uuid, 'aprobada'::public.inspection_status, 'Parcela en excelentes condiciones', 'Continuar con el plan de fertilización actual', 9),
        (parcel2_uuid, operador_uuid, 'pendiente'::public.inspection_status, 'Requiere inspección de sistema de drenaje', 'Verificar canales de agua antes de siembra', null);

    -- Create financings
    INSERT INTO public.financings (id, farmer_cedula, monto_solicitado, monto_aprobado, proposito, estado, nivel_riesgo, numero_cuotas, tasa_interes, created_by)
    VALUES
        (financing1_uuid, farmer1_cedula, 25000.00, 20000.00, 'Compra de semillas y fertilizantes para próxima siembra', 'aprobado'::public.financing_status, 'bajo'::public.risk_level, 12, 8.5, operador_uuid);

    -- Create productive subjects
    INSERT INTO public.productive_subjects (farmer_cedula, observaciones)
    VALUES
        (farmer1_cedula, 'Agricultor con excelente historial crediticio'),
        (farmer2_cedula, 'Nueva incorporación al programa de financiamiento');

    -- Log initial activities
    PERFORM public.log_activity('farmer', farmer1_cedula, 'created', '{"source": "migration", "operator": "system"}'::jsonb);
    PERFORM public.log_activity('farmer', farmer2_cedula, 'created', '{"source": "migration", "operator": "system"}'::jsonb);
    PERFORM public.log_activity('financing', financing1_uuid::text, 'approved', '{"monto": 20000.00, "cuotas": 12}'::jsonb);

END $$;