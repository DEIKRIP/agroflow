import { supabase } from '../lib/supabase';

// Demo mode flag
const DEMO = String(import.meta.env.VITE_DEMO_MODE || '').toLowerCase() === 'true';

// Mock data for demo mode
const demoFarmers = [
  {
    cedula: 'V10395700',
    farmer_cedula: 'V10395700',
    display_id: 'F-0001',
    nombre_completo: 'Juan Pérez',
    email: 'juan.perez@example.com',
    telefono: '+58 412-1234567',
    risk: 'medio',
    created_by: 'demo-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    parcels: [{ count: 2, display_id: 'P-0001' }],
    financings: [{ count: 1, display_id: 'C-0001' }],
    created_by_profile: { full_name: 'Demo Admin' },
  },
  {
    cedula: 'V20456789',
    farmer_cedula: 'V20456789',
    display_id: 'F-0002',
    nombre_completo: 'María González',
    email: 'maria.gonzalez@example.com',
    telefono: '+58 416-9876543',
    risk: 'bajo',
    created_by: 'demo-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    parcels: [{ count: 1, display_id: 'P-0003' }],
    financings: [{ count: 0, display_id: 'C-0002' }],
    created_by_profile: { full_name: 'Demo Admin' },
  },
];

const farmerService = {
  // Get all farmers with pagination and filters
  getFarmers: async (filters = {}, page = 1, limit = 20) => {
    try {
      if (DEMO) {
        // Simple filter/search
        let data = demoFarmers;
        if (filters?.search) {
          const s = String(filters.search).toLowerCase();
          data = data.filter(
            (f) =>
              f.nombre_completo.toLowerCase().includes(s) ||
              String(f.cedula).toLowerCase().includes(s) ||
              String(f.email).toLowerCase().includes(s)
          );
        }
        if (filters?.risk) {
          data = data.filter((f) => f.risk === filters.risk);
        }
        const total = data.length;
        const from = (page - 1) * limit;
        const to = from + limit;
        const slice = data.slice(from, to);
        return {
          success: true,
          data: slice,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
          },
        };
      }
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
      if (DEMO) {
        const found = demoFarmers.find((f) => String(f.cedula) === String(cedula));
        if (!found) return { success: false, error: 'No encontrado' };
        return { success: true, data: found };
      }
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
      if (DEMO) {
        const data = {
          ...farmerData,
          cedula: farmerData?.cedula || farmerData?.farmer_cedula || `V${Math.floor(Math.random()*9000000+1000000)}`,
          display_id: `F-${String(demoFarmers.length + 1).padStart(4,'0')}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        demoFarmers.push(data);
        return { success: true, data };
      }
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
      if (DEMO) {
        const idx = demoFarmers.findIndex((f) => String(f.cedula) === String(cedula));
        if (idx === -1) return { success: false, error: 'No encontrado' };
        demoFarmers[idx] = { ...demoFarmers[idx], ...updates, updated_at: new Date().toISOString() };
        return { success: true, data: demoFarmers[idx] };
      }
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
      if (DEMO) {
        const idx = demoFarmers.findIndex((f) => String(f.cedula) === String(cedula));
        if (idx === -1) return { success: false, error: 'No encontrado' };
        demoFarmers.splice(idx, 1);
        return { success: true };
      }
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
      if (DEMO) {
        const data = demoFarmers;
        const stats = {
          total: data.length,
          risk_breakdown: {
            bajo: data.filter((f) => f.risk === 'bajo').length,
            medio: data.filter((f) => f.risk === 'medio').length,
            alto: data.filter((f) => f.risk === 'alto').length,
          },
        };
        return { success: true, data: stats };
      }
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
      if (DEMO) {
        const now = new Date().toISOString();
        const data = [
          {
            id: 'act-1',
            entity_type: 'farmer',
            performed_by: 'demo-user-id',
            performer: { full_name: 'Demo Admin', role: 'admin' },
            action: 'created',
            details: { name: demoFarmers[0]?.nombre_completo },
            created_at: now,
          },
          {
            id: 'act-2',
            entity_type: 'farmer',
            performed_by: 'demo-user-id',
            performer: { full_name: 'Demo Admin', role: 'admin' },
            action: 'updated',
            details: { fields_updated: ['telefono'] },
            created_at: now,
          },
        ].slice(0, limit);
        return { success: true, data };
      }
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