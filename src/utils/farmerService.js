import { supabase } from '../lib/supabase';

const farmerService = {
  // Get all farmers with pagination and filters
  getFarmers: async (filters = {}, page = 1, limit = 20) => {
    try {
      let query = supabase
        .from('farmers')
        .select(`
          *,
          display_id,
          parcels:parcels(count, display_id),
          financings:financings(count, display_id),
          created_by_profile:user_profiles!created_by(full_name)
        `)
        .order('display_id', { ascending: true });

      // Apply filters
      if (filters?.search) {
        query = query.or(`nombre_completo.ilike.%${filters.search}%,cedula.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      if (filters?.risk) {
        query = query.eq('risk', filters.risk);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        data,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      if (error?.message?.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'No se puede conectar a la base de datos. Verifica tu proyecto de Supabase.' 
        };
      }
      return { success: false, error: 'Error al cargar agricultores' };
    }
  },

  // Get farmer by cedula
  getFarmerByCedula: async (cedula) => {
    try {
      const { data, error } = await supabase
        .from('farmers')
        .select(`
          *,
          parcels:parcels(*),
          financings:financings(*),
          inspections:parcels(inspections(*)),
          created_by_profile:user_profiles!created_by(full_name, role)
        `)
        .eq('cedula', cedula)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Error al cargar datos del agricultor' };
    }
  },

  // Create new farmer
  createFarmer: async (farmerData) => {
    try {
      const { data, error } = await supabase
        .from('farmers')
        .insert([{
          ...farmerData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Log activity
      await supabase.rpc('log_activity', {
        p_entity_type: 'farmer',
        p_entity_id: data.cedula,
        p_action: 'created',
        p_details: { source: 'web_app' }
      });

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Error al crear agricultor' };
    }
  },

  // Update farmer
  updateFarmer: async (cedula, updates) => {
    try {
      const { data, error } = await supabase
        .from('farmers')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('cedula', cedula)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Log activity
      await supabase.rpc('log_activity', {
        p_entity_type: 'farmer',
        p_entity_id: cedula,
        p_action: 'updated',
        p_details: { fields_updated: Object.keys(updates) }
      });

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Error al actualizar agricultor' };
    }
  },

  // Delete farmer
  deleteFarmer: async (cedula) => {
    try {
      const { error } = await supabase
        .from('farmers')
        .delete()
        .eq('cedula', cedula);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al eliminar agricultor' };
    }
  },

  // Get farmer statistics
  getFarmerStats: async () => {
    try {
      const { data, error } = await supabase
        .from('farmers')
        .select('risk');

      if (error) {
        return { success: false, error: error.message };
      }

      const stats = {
        total: data?.length || 0,
        risk_breakdown: {
          bajo: data?.filter(f => f.risk === 'bajo')?.length || 0,
          medio: data?.filter(f => f.risk === 'medio')?.length || 0,
          alto: data?.filter(f => f.risk === 'alto')?.length || 0
        }
      };

      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: 'Error al cargar estadísticas' };
    }
  },

  // Get recent activity
  getRecentActivity: async (limit = 10) => {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select(`
          *,
          performer:user_profiles!performed_by(full_name, role)
        `)
        .eq('entity_type', 'farmer')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Error al cargar actividad reciente' };
    }
  }
};

export default farmerService;