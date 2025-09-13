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
        if (filters?.cultivo) {
          data = data.filter((p) => p.cultivo_principal === filters.cultivo);
        }
        if (filters?.tipo_suelo) {
          data = data.filter((p) => p.tipo_suelo === filters.tipo_suelo);
        }
        if (filters?.min_hectareas) {
          data = data.filter((p) => Number(p.area_hectareas) >= Number(filters.min_hectareas));
        }
        if (filters?.max_hectareas) {
          data = data.filter((p) => Number(p.area_hectareas) <= Number(filters.max_hectareas));
        }
        return { success: true, data };
      }
      // Select '*' to be compatible with multiple schema versions; include relation to farmers
      let query = supabase
        .from('parcels')
        .select(`
          *,
          farmers:farmer_id (
            id,
            user_id,
            full_name,
            cedula,
            email,
            profile_image_url
          )
        `);

      // Apply filters
      if (filters?.id_farmer) {
        query = query.eq('farmer_id', filters.id_farmer);
      }

      if (filters?.cultivo) {
        query = query.eq('cultivo_principal', filters.cultivo);
      }

      if (filters?.tipo_suelo) {
        query = query.eq('tipo_suelo', filters.tipo_suelo);
      }

      if (filters?.min_hectareas) {
        query = query.gte('area_hectareas', filters.min_hectareas);
      }

      if (filters?.max_hectareas) {
        query = query.lte('area_hectareas', filters.max_hectareas);
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
        area_hectares,
        soil_type,
        primary_crop,
        planting_date,
        description,
        lat,
        lng,
      } = parcelData || {};

      const { data, error } = await supabase.rpc('create_parcel_v2', {
        p_farmer_id: farmer_id || null,
        p_name: name || null,
        p_area_hectares: area_hectares ?? null,
        p_lat: typeof lat === 'number' ? lat : (lat ?? null),
        p_lng: typeof lng === 'number' ? lng : (lng ?? null),
        p_primary_crop: primary_crop || null,
        p_soil_type: soil_type || null,
        p_planting_date: planting_date || null,
        p_description: description || null,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Log activity (best-effort)
      try {
        await supabase.rpc('log_activity', {
          p_entity_type: 'parcel',
          p_entity_id: data?.id,
          p_action: 'created',
          p_details: { farmer_id: farmer_id || null }
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
      const { data, error } = await supabase
        .from('financings')
        .insert([{ 
          farmer_cedula: farmer_cedula || null,
          monto_solicitado: amount || 0,
          proposito: proposito || 'Solicitud generada desde parcela',
          nivel_riesgo: nivel_riesgo,
          created_by: userId
        }])
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
      const { data, error } = await supabase
        .from('parcels')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', parcelId)
        .select(`
          id,
          farmer_id,
          name,
          area_hectares,
          lat,
          lng,
          primary_crop,
          soil_type,
          planting_date,
          description,
          status,
          created_at,
          farmers:farmer_id (id, full_name, cedula)
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
          suelos: {},
        };
        data.forEach((parcel) => {
          const cultivo = parcel.cultivo_principal;
          const suelo = parcel.tipo_suelo;
          stats.cultivos[cultivo] = (stats.cultivos[cultivo] || 0) + 1;
          stats.suelos[suelo] = (stats.suelos[suelo] || 0) + 1;
        });
        return { success: true, data: stats };
      }
      const { data, error } = await supabase
        .from('parcels')
        .select('cultivo_principal, area_hectareas, tipo_suelo');

      if (error) {
        return { success: false, error: error.message };
      }

      const stats = {
        total: data?.length || 0,
        total_area: data?.reduce((sum, p) => sum + parseFloat(p.area_hectareas || 0), 0) || 0,
        cultivos: {},
        suelos: {}
      };

      // Group by crop type
      data?.forEach(parcel => {
        const cultivo = parcel.cultivo_principal;
        const suelo = parcel.tipo_suelo;
        
        stats.cultivos[cultivo] = (stats.cultivos[cultivo] || 0) + 1;
        stats.suelos[suelo] = (stats.suelos[suelo] || 0) + 1;
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
      
      // Mock AI suggestions based on soil type and location
      const suggestions = [];
      
      switch (parcel.tipo_suelo) {
        case 'franco':
          suggestions.push(
            { 
              cultivo: 'maiz', 
              confianza: 0.95, 
              justificacion: 'Suelo franco ideal para maíz, excelente retención de agua y nutrientes' 
            },
            { 
              cultivo: 'frijol', 
              confianza: 0.87, 
              justificacion: 'Leguminosa que mejora la fertilidad del suelo franco' 
            }
          );
          break;
        case 'arcilloso':
          suggestions.push(
            { 
              cultivo: 'arroz', 
              confianza: 0.92, 
              justificacion: 'Suelo arcilloso retiene agua perfectamente para cultivo de arroz' 
            },
            { 
              cultivo: 'yuca', 
              confianza: 0.78, 
              justificacion: 'Resistente a suelos pesados y compactos' 
            }
          );
          break;
        case 'arenoso':
          suggestions.push(
            { 
              cultivo: 'papa', 
              confianza: 0.83, 
              justificacion: 'Drenaje excelente en suelo arenoso favorece tubérculos' 
            },
            { 
              cultivo: 'cebolla', 
              confianza: 0.76, 
              justificacion: 'Bulbos se desarrollan bien en suelos bien drenados' 
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