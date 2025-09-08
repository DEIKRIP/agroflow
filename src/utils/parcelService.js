import { supabase } from '../lib/supabase';
import api from '../lib/api';

const parcelService = {
  // Get parcels with filters
  getParcels: async (filters = {}) => {
    try {
      let query = supabase
        .from('parcels')
        .select(`
          *,
          display_id,
          farmer:farmers!farmer_cedula(nombre_completo, cedula, risk, display_id),
          inspections:inspections(
            id, display_id, estado, fecha_inspeccion, calificacion_calidad,
            inspector:user_profiles!inspector_id(full_name)
          )
        `)
        .order('display_id', { ascending: true });

      // Apply filters
      if (filters?.farmer_cedula) {
        query = query.eq('farmer_cedula', filters.farmer_cedula);
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
      const { data, error } = await supabase
        .from('parcels')
        .select(`
          *,
          farmer:farmers!farmer_cedula(*),
          inspections:inspections(
            *,
            inspector:user_profiles!inspector_id(full_name, role)
          )
        `)
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

  // Create parcel (frontend must supply required columns: area_hectareas, cultivo_principal)
  createParcel: async (parcelData) => {
    try {
      // Insert only existing columns for current schema
      const { data, error } = await supabase
        .from('parcels')
        .insert([parcelData])
        .select(`
          *,
          farmer:farmers!farmer_cedula(nombre_completo, cedula)
        `)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Log activity (best-effort)
      try {
        await supabase.rpc('log_activity', {
          p_entity_type: 'parcel',
          p_entity_id: data.id,
          p_action: 'created',
          p_details: { 
            farmer_cedula: data.farmer_cedula,
            area_hectareas: data.area_hectareas,
            cultivo: data.cultivo_principal
          }
        });
      } catch (_) {}

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Error al crear parcela' };
    }
  },

  // Request an inspection for a parcel (helper; table created by migration)
  requestInspection: async ({ parcel_id, priority = 'media', scheduled_at = null, metadata = {} }) => {
    try {
      // Use API to enforce validation & dedupe
      const data = await api.post('/inspections', {
        parcel_id,
        priority,
        scheduled_at,
        metadata
      });
      return { success: true, data };
    } catch (e) {
      return { success: false, error: e?.message || 'Error al solicitar inspección' };
    }
  },

  // Request financing stub (will be used later in the flow)
  requestFinancing: async ({ farmer_cedula, amount }) => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) return { success: false, error: 'No autenticado' };
      const { data, error } = await supabase
        .from('financing')
        .insert([{ user_id: userId, farmer_cedula: farmer_cedula || null, amount: amount || 0, status: 'requested' }])
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
      const { data, error } = await supabase
        .from('parcels')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', parcelId)
        .select(`
          *,
          farmer:farmers!farmer_cedula(nombre_completo, cedula)
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