import { supabase } from '../lib/supabase';

// Demo mode flag
const DEMO = String(import.meta.env.VITE_DEMO_MODE || '').toLowerCase() === 'true';

// Mock data for demo mode
const demoParcels = [
  {
    id: 'p-1',
    display_id: 'P-0001',
    farmer_cedula: 'V10395700',
    nombre: 'Parcela La Esperanza',
    area_hectareas: 12.5,
    tipo_suelo: 'franco',
    cultivo_principal: 'maiz',
    fecha_siembra: '2025-05-12',
    descripcion: 'Parcela principal orientada a maíz',
    ubicacion_lat: 10.491,
    ubicacion_lng: -66.9036,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    farmer: { nombre_completo: 'Juan Pérez', farmer_cedula: 'V10395700', risk: 'medio', display_id: 'F-0001' },
    inspections: [
      { id: 'i-1', display_id: 'I-0001', estado: 'completada', fecha_inspeccion: '2025-06-15', calificacion_calidad: 4, inspector: { full_name: 'Demo Admin' } },
    ],
  },
  {
    id: 'p-2',
    display_id: 'P-0002',
    farmer_cedula: 'V10395700',
    nombre: 'Parcela El Progreso',
    area_hectareas: 7.2,
    tipo_suelo: 'arenoso',
    cultivo_principal: 'papa',
    fecha_siembra: '2025-07-01',
    descripcion: 'Suelo arenoso con buen drenaje',
    ubicacion_lat: 10.502,
    ubicacion_lng: -66.92,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    farmer: { nombre_completo: 'Juan Pérez', farmer_cedula: 'V10395700', risk: 'medio', display_id: 'F-0001' },
    inspections: [],
  },
  {
    id: 'p-3',
    display_id: 'P-0003',
    farmer_cedula: 'V20456789',
    nombre: 'Parcela Santa Rosa',
    area_hectareas: 4.8,
    tipo_suelo: 'arcilloso',
    cultivo_principal: 'arroz',
    fecha_siembra: '2025-03-22',
    descripcion: 'Ligeramente inundable, ideal para arroz',
    ubicacion_lat: 10.51,
    ubicacion_lng: -66.89,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    farmer: { nombre_completo: 'María González', farmer_cedula: 'V20456789', risk: 'bajo', display_id: 'F-0002' },
    inspections: [
      { id: 'i-2', display_id: 'I-0002', estado: 'pendiente', fecha_inspeccion: null, calificacion_calidad: null, inspector: { full_name: 'Demo Admin' } },
    ],
  },
];

const parcelService = {
  // Get parcels with filters
  getParcels: async (filters = {}) => {
    try {
      if (DEMO) {
        let data = demoParcels.map((p) => ({ ...p }));
        if (filters?.farmer_cedula) {
          data = data.filter((p) => p.farmer_cedula === filters.farmer_cedula);
        }
        if (filters?.cultivo || filters?.crop_type) {
          const ct = filters?.crop_type || filters?.cultivo;
          data = data.filter((p) => p.cultivo_principal === ct);
        }
        if (filters?.min_surface_area || filters?.min_hectareas) {
          const min = Number(filters?.min_surface_area ?? filters?.min_hectareas);
          data = data.filter((p) => Number(p.area_hectareas) >= min);
        }
        if (filters?.max_surface_area || filters?.max_hectareas) {
          const max = Number(filters?.max_surface_area ?? filters?.max_hectareas);
          data = data.filter((p) => Number(p.area_hectareas) <= max);
        }
        return { success: true, data };
      }
      // Real DB schema selection
      let query = supabase
        .from('parcels')
        .select(`
          id,
          farmer_id,
          name,
          crop_type,
          surface_area,
          location_lat,
          location_lng,
          description,
          is_active,
          created_at,
          updated_at,
          farmer:farmer_id (
            id,
            user_id,
            full_name,
            cedula,
            email,
            profile_image_url
          )
        `);

      // Apply filters
      if (filters?.id_farmer || filters?.farmer_id) {
        query = query.eq('farmer_id', filters.id_farmer ?? filters.farmer_id);
      }

      if (filters?.cultivo || filters?.crop_type) {
        query = query.eq('crop_type', filters.crop_type ?? filters.cultivo);
      }

      if (filters?.min_surface_area || filters?.min_hectareas) {
        query = query.gte('surface_area', filters.min_surface_area ?? filters.min_hectareas);
      }

      if (filters?.max_surface_area || filters?.max_hectareas) {
        query = query.lte('surface_area', filters.max_surface_area ?? filters.max_hectareas);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'No se puede conectar a la base de datos.' 
        };
      }
      return { success: false, error: 'Error al cargar parcelas' };
    }
  },

  // Get single parcel
  getParcel: async (parcelId) => {
    try {
      if (DEMO) {
        const found = demoParcels.find((p) => String(p.id) === String(parcelId) || String(p.display_id) === String(parcelId));
        if (!found) return { success: false, error: 'No encontrado' };
        return { success: true, data: { ...found } };
      }
      const { data, error } = await supabase
        .from('parcels')
        .select('*')
        .eq('id', parcelId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Error al cargar parcela' };
    }
  },

  // Create parcel using RPC to respect RLS and server-side validations
  createParcel: async (parcelData) => {
    try {
      if (DEMO) {
        const nextNum = demoParcels.length + 1;
        const data = {
          id: `p-${nextNum}`,
          display_id: `P-${String(nextNum).padStart(4, '0')}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...parcelData,
        };
        demoParcels.push(data);
        return { success: true, data };
      }
      const {
        farmer_id,
        name,
        crop_type,
        surface_area,
        location_lat,
        location_lng,
        description,
        // Legacy compatibility
        primary_crop,
        area_hectares,
        lat,
        lng,
      } = parcelData || {};

      const insertPayload = {
        farmer_id: farmer_id || null,
        name: name || null,
        crop_type: crop_type ?? primary_crop ?? null,
        surface_area: surface_area ?? area_hectares ?? null,
        location_lat: typeof location_lat === 'number' ? location_lat : (lat ?? null),
        location_lng: typeof location_lng === 'number' ? location_lng : (lng ?? null),
        description: description ?? null,
      };

      const { data, error } = await supabase
        .from('parcels')
        .insert([insertPayload])
        .select('*')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Log activity (best-effort)
      try {
        await supabase.rpc('log_activity', {
          p_entity_type: 'parcel',
          p_entity_id: data?.id,
          p_action: 'created',
          p_details: { farmer_id: insertPayload.farmer_id || null }
        });
      } catch (_) {}

      return { success: true, data };
    } catch (e) {
      return { success: false, error: 'Error al crear parcela' };
    }
  },

  // Request an inspection for a parcel (helper; table created by migration)
  requestInspection: async ({ parcel_id, priority = 'media', scheduled_at = null, metadata = {} }) => {
    try {
      if (DEMO) {
        const id = `i-${Math.floor(Math.random() * 100000)}`;
        const data = { id, parcel_id, priority, scheduled_at, metadata, status: 'pendiente', created_at: new Date().toISOString() };
        // Attach to parcel mock
        const p = demoParcels.find((x) => x.id === parcel_id || x.display_id === parcel_id);
        if (p) {
          p.inspections = p.inspections || [];
          p.inspections.push({ id, display_id: id.toUpperCase(), estado: 'pendiente', fecha_inspeccion: scheduled_at, calificacion_calidad: null, inspector: { full_name: 'Demo Admin' } });
        }
        return { success: true, data };
      }
      // Use Supabase RPC to enforce validation & dedupe on the DB side
      const { data, error } = await supabase.rpc('create_inspection_v2', {
        p_parcel_id: parcel_id,
        p_notes: (metadata && metadata.notes) ? String(metadata.notes) : null,
      });
      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (e) {
      return { success: false, error: e?.message || 'Error al solicitar inspección' };
    }
  },

  // Request financing stub (will be used later in the flow)
  requestFinancing: async ({ farmer_cedula, amount, proposito = null, nivel_riesgo = null }) => {
    try {
      if (DEMO) {
        const data = { id: `c-${Math.floor(Math.random()*100000)}`, farmer_cedula, monto_solicitado: amount || 0, proposito: proposito || 'Solicitud demo', nivel_riesgo, created_by: 'demo-user-id' };
        return { success: true, data };
      }
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) return { success: false, error: 'No autenticado' };

      // Resolve farmer_id from cedula
      const { data: farmer, error: fErr } = await supabase
        .from('farmers')
        .select('id, cedula')
        .eq('cedula', farmer_cedula)
        .maybeSingle();
      if (fErr) return { success: false, error: fErr.message };
      if (!farmer?.id) return { success: false, error: 'Agricultor no encontrado por cédula' };

      const payload = {
        farmer_id: farmer.id,
        parcel_id: null, // caller may extend to pass parcel_id
        requested_amount: amount || 0,
        purpose: proposito || 'Solicitud generada desde parcela',
        created_by: userId,
        status: 'requested'
      };

      const { data, error } = await supabase
        .from('financing')
        .insert([payload])
        .select('*')
        .single();
      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (e) {
      return { success: false, error: 'Error al solicitar financiamiento' };
    }
  },

  // Update parcel
  updateParcel: async (parcelId, updates) => {
    try {
      if (DEMO) {
        const idx = demoParcels.findIndex((p) => String(p.id) === String(parcelId) || String(p.display_id) === String(parcelId));
        if (idx === -1) return { success: false, error: 'No encontrado' };
        demoParcels[idx] = { ...demoParcels[idx], ...updates, updated_at: new Date().toISOString() };
        const data = { ...demoParcels[idx], farmer: demoParcels[idx].farmer };
        return { success: true, data };
      }
      const mapped = {
        name: updates?.name ?? undefined,
        crop_type: updates?.crop_type ?? updates?.primary_crop ?? undefined,
        surface_area: updates?.surface_area ?? updates?.area_hectares ?? undefined,
        location_lat: typeof updates?.location_lat === 'number' ? updates.location_lat : (updates?.lat ?? undefined),
        location_lng: typeof updates?.location_lng === 'number' ? updates.location_lng : (updates?.lng ?? undefined),
        description: updates?.description ?? undefined,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from('parcels')
        .update(mapped)
        .eq('id', parcelId)
        .select(`
          id,
          farmer_id,
          name,
          crop_type,
          surface_area,
          location_lat,
          location_lng,
          description,
          is_active,
          created_at,
          updated_at,
          farmer:farmer_id (id, full_name, cedula)
        `)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Log activity
      await supabase.rpc('log_activity', {
        p_entity_type: 'parcel',
        p_entity_id: parcelId,
        p_action: 'updated',
        p_details: { fields_updated: Object.keys(updates) }
      });

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Error al actualizar parcela' };
    }
  },

  // Delete parcel
  deleteParcel: async (parcelId) => {
    try {
      if (DEMO) {
        const idx = demoParcels.findIndex((p) => String(p.id) === String(parcelId) || String(p.display_id) === String(parcelId));
        if (idx === -1) return { success: false, error: 'No encontrado' };
        demoParcels.splice(idx, 1);
        return { success: true };
      }
      const { error } = await supabase
        .from('parcels')
        .delete()
        .eq('id', parcelId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al eliminar parcela' };
    }
  },

  // Get parcel statistics
  getParcelStats: async () => {
    try {
      if (DEMO) {
        const data = demoParcels;
        const stats = {
          total: data.length,
          total_area: data.reduce((sum, p) => sum + Number(p.area_hectareas || 0), 0),
          cultivos: {},
        };
        data.forEach((parcel) => {
          const cultivo = parcel.cultivo_principal;
          stats.cultivos[cultivo] = (stats.cultivos[cultivo] || 0) + 1;
        });
        return { success: true, data: stats };
      }
      const { data, error } = await supabase
        .from('parcels')
        .select('crop_type, surface_area');

      if (error) {
        return { success: false, error: error.message };
      }

      const stats = {
        total: data?.length || 0,
        total_area: data?.reduce((sum, p) => sum + Number(p.surface_area || 0), 0) || 0,
        cultivos: {},
      };

      // Group by crop type
      data?.forEach(parcel => {
        const cultivo = parcel.crop_type;
        stats.cultivos[cultivo] = (stats.cultivos[cultivo] || 0) + 1;
      });

      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: 'Error al cargar estadísticas de parcelas' };
    }
  },

  // Get crop suggestions for a parcel (mock AI service)
  getCropSuggestions: async (parcelId) => {
    try {
      const parcelResult = await parcelService.getParcel(parcelId);
      
      if (!parcelResult.success) {
        return parcelResult;
      }

      const parcel = parcelResult.data;
      
      // Mock AI suggestions based on crop type (soil info not available in current schema)
      const suggestions = [];
      
      switch (parcel.crop_type) {
        case 'maiz':
          suggestions.push(
            { 
              cultivo: 'maiz',
              confianza: 0.9,
              justificacion: 'Variedades locales adaptadas a tu zona productiva'
            },
            { 
              cultivo: 'frijol',
              confianza: 0.82,
              justificacion: 'Rotación recomendada para mejorar fertilidad'
            }
          );
          break;
        case 'arroz':
          suggestions.push(
            { 
              cultivo: 'arroz',
              confianza: 0.88,
              justificacion: 'Buen rendimiento con manejo hídrico adecuado'
            },
            { 
              cultivo: 'yuca',
              confianza: 0.76,
              justificacion: 'Alternativa resistente con buena aceptación'
            }
          );
          break;
        case 'papa':
          suggestions.push(
            { 
              cultivo: 'papa',
              confianza: 0.83,
              justificacion: 'Condiciones favorables para tubérculos'
            },
            { 
              cultivo: 'cebolla', 
              confianza: 0.76, 
              justificacion: 'Buena rotación con papa, demanda estable'
            }
          );
          break;
        default:
          suggestions.push(
            { 
              cultivo: 'platano', 
              confianza: 0.75, 
              justificacion: 'Cultivo versátil adaptable a diversos tipos de suelo' 
            }
          );
      }

      return { success: true, data: suggestions };
    } catch (error) {
      return { success: false, error: 'Error al generar sugerencias de cultivo' };
    }
  }
};

export default parcelService;