// Netlify Function: POST /api/inspections
// Requires env: SUPABASE_URL, SUPABASE_ANON_KEY

const { createClient } = require('@supabase/supabase-js');

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(body)
  };
}

async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return json(500, { error: 'Missing Supabase configuration' });
  }

  // Use the caller's auth session (Authorization: Bearer <access_token>)
  const authorization = event.headers.authorization || event.headers.Authorization;
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: authorization ? { Authorization: authorization } : {}
    }
  });

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { error: 'Invalid JSON body' });
  }

  const { parcel_id, created_by, priority = 'media', scheduled_at = null, metadata = {} } = payload || {};

  // Validate auth
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;
  if (!userId) {
    return json(401, { error: 'No autenticado' });
  }
  if (created_by && created_by !== userId) {
    return json(403, { error: 'created_by no coincide con el usuario autenticado' });
  }

  // Validate parcel_id
  if (parcel_id == null) {
    return json(400, { error: 'parcel_id es requerido' });
  }

  // 1) Load parcel and farmer relationship
  const { data: parcel, error: parcelErr } = await supabase
    .from('parcels')
    .select('id, display_id, area_hectareas, cultivo_principal, farmer_cedula, id_farmer, ubicacion_lat, ubicacion_lng')
    .eq('id', parcel_id)
    .single();

  if (parcelErr || !parcel) {
    return json(404, { error: 'Parcela no existe' });
  }
  if (!parcel.farmer_cedula) {
    return json(422, { error: 'La parcela no está asociada a un agricultor' });
  }

  // 2) Dedup: avoid creating if there is an open inspection
  const openStatuses = ['pendiente', 'programada', 'en_progreso'];
  const { data: dup, error: dupErr } = await supabase
    .from('inspections')
    .select('id')
    .eq('parcel_id', parcel.id)
    .in('status', openStatuses)
    .limit(1)
    .maybeSingle();

  if (dupErr) {
    return json(500, { error: 'Error verificando duplicados', details: dupErr.message });
  }
  if (dup) {
    return json(409, { error: 'Ya existe una inspección abierta para esta parcela' });
  }

  // 3) Create inspection
  const insertObj = {
    parcel_id: parcel.id,
    farmer_cedula: parcel.farmer_cedula,
    created_by: userId,
    status: 'pendiente',
    priority,
    scheduled_at: scheduled_at ?? null,
    metadata: {
      ...metadata,
      trigger: metadata?.trigger || 'from_parcel_card',
      source_ui: metadata?.source_ui || 'parcel_card',
      parcel_snapshot: metadata?.parcel_snapshot || {
        code: parcel.display_id || String(parcel.id),
        area_ha: parcel.area_hectareas ?? null,
        cultivo: parcel.cultivo_principal || null,
        coords: [parcel.ubicacion_lat ?? null, parcel.ubicacion_lng ?? null]
      }
    }
  };

  const { data: created, error: createErr } = await supabase
    .from('inspections')
    .insert([insertObj])
    .select('id, parcel_id, status, created_at')
    .single();

  if (createErr) {
    return json(500, { error: 'Error creando inspección', details: createErr.message });
  }

  // 4) Load farmer minimal info for response
  const { data: farmer } = await supabase
    .from('farmers')
    .select('cedula, nombre_completo')
    .eq('cedula', parcel.farmer_cedula)
    .maybeSingle();

  const response = {
    id: created.id,
    parcel_id: created.parcel_id,
    id_farmer: parcel.id_farmer ?? null,
    farmer: farmer ? { id: farmer.cedula, name: farmer.nombre_completo, cedula: farmer.cedula } : null,
    parcel: { id: parcel.id, code: parcel.display_id || String(parcel.id), area_ha: parcel.area_hectareas ?? null },
    status: created.status,
    created_at: created.created_at
  };

  return json(200, response);
}

module.exports = { handler };
