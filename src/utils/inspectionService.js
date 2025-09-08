import { supabase } from '../lib/supabase';

const inspectionService = {
  // Get inspections with filters
  getInspections: async (filters = {}) => {
    try {
      let query = supabase
        .from('inspections')
        .select(`
          *,
          parcel:parcels!parcel_id(
            id, display_id, area_hectareas, cultivo_principal, tipo_suelo,
            farmer:farmers!farmer_cedula(nombre_completo, cedula, display_id)
          ),
          inspector:user_profiles!inspector_id(full_name, role)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.inspector_id) {
        query = query.eq('inspector_id', filters.inspector_id);
      }

      if (filters?.parcel_id) {
        query = query.eq('parcel_id', filters.parcel_id);
      }

      if (filters?.farmer_cedula) {
        query = query.eq('parcels.farmer_cedula', filters.farmer_cedula);
      }

      if (filters?.fecha_desde) {
        query = query.gte('scheduled_at', filters.fecha_desde);
      }

      if (filters?.fecha_hasta) {
        query = query.lte('scheduled_at', filters.fecha_hasta);
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
      return { success: false, error: 'Error al cargar inspecciones' };
    }
  },

  // Get single inspection
  getInspection: async (inspectionId) => {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select(`
          *,
          parcel:parcels!parcel_id(
            *,
            farmer:farmers!farmer_cedula(*)
          ),
          inspector:user_profiles!inspector_id(full_name, role, email)
        `)
        .eq('id', inspectionId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Error al cargar inspección' };
    }
  },

  // Create inspection
  createInspection: async (inspectionData) => {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .insert([{
          ...inspectionData,
          scheduled_at: inspectionData.scheduled_at || null,
          status: inspectionData.status || 'pendiente',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select(`
          *,
          parcel:parcels!parcel_id(
            id, area_hectareas, cultivo_principal,
            farmer:farmers!farmer_cedula(nombre_completo, cedula)
          ),
          inspector:user_profiles!inspector_id(full_name)
        `)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Log activity
      await supabase.rpc('log_activity', {
        p_entity_type: 'inspection',
        p_entity_id: data.id,
        p_action: 'created',
        p_details: { 
          parcel_id: data.parcel_id,
          status: data.status
        }
      });

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Error al crear inspección' };
    }
  },

  // Update inspection
  updateInspection: async (inspectionId, updates) => {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', inspectionId)
        .select(`
          *,
          parcel:parcels!parcel_id(
            id, area_hectareas, cultivo_principal,
            farmer:farmers!farmer_cedula(nombre_completo, cedula)
          ),
          inspector:user_profiles!inspector_id(full_name)
        `)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Log activity
      await supabase.rpc('log_activity', {
        p_entity_type: 'inspection',
        p_entity_id: inspectionId,
        p_action: 'updated',
        p_details: { 
          fields_updated: Object.keys(updates),
          new_status: updates.status
        }
      });

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Error al actualizar inspección' };
    }
  },

  // Delete inspection
  deleteInspection: async (inspectionId) => {
    try {
      const { error } = await supabase
        .from('inspections')
        .delete()
        .eq('id', inspectionId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al eliminar inspección' };
    }
  },

  // Get inspection statistics
  getInspectionStats: async () => {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('status, calificacion_calidad, scheduled_at');

      if (error) {
        return { success: false, error: error.message };
      }

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const stats = {
        total: data?.length || 0,
        by_status: {},
        this_month: data?.filter(i => new Date(i.scheduled_at || i.created_at) >= thisMonth)?.length || 0,
        average_quality: 0,
        quality_distribution: {}
      };

      // Group by status
      data?.forEach(inspection => {
        const status = inspection.status;
        stats.by_status[status] = (stats.by_status[status] || 0) + 1;
        
        if (inspection.calificacion_calidad) {
          const quality = inspection.calificacion_calidad;
          stats.quality_distribution[quality] = (stats.quality_distribution[quality] || 0) + 1;
        }
      });

      // Calculate average quality
      const qualityRatings = data?.filter(i => i.calificacion_calidad).map(i => i.calificacion_calidad) || [];
      if (qualityRatings.length > 0) {
        stats.average_quality = qualityRatings.reduce((sum, rating) => sum + rating, 0) / qualityRatings.length;
      }

      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: 'Error al cargar estadísticas de inspecciones' };
    }
  },

  // Get pending inspections (queue)
  getPendingInspections: async () => {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select(`
          *,
          parcel:parcels!parcel_id(
            id, area_hectareas, cultivo_principal, ubicacion_lat, ubicacion_lng,
            farmer:farmers!farmer_cedula(nombre_completo, cedula, telefono)
          )
        `)
        .eq('status', 'pendiente')
        .order('created_at', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Error al cargar cola de inspecciones' };
    }
  },

  // Get inspections by inspector
  getInspectionsByInspector: async (inspectorId) => {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select(`
          *,
          parcel:parcels!parcel_id(
            id, area_hectareas, cultivo_principal,
            farmer:farmers!farmer_cedula(nombre_completo, cedula)
          )
        `)
        .eq('inspector_id', inspectorId)
        .order('scheduled_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Error al cargar inspecciones del inspector' };
    }
  }
};

export default inspectionService;