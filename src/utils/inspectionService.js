import { supabase } from '../lib/supabase';

// Demo mode flag
const DEMO = String(import.meta.env.VITE_DEMO_MODE || '').toLowerCase() === 'true';

// Mock data for demo mode
const demoInspections = [
  {
    id: 'i-1',
    display_id: 'I-0001',
    parcel_id: 'p-1',
    status: 'completada',
    estado: 'completada',
    scheduled_at: '2025-06-10',
    fecha_inspeccion: '2025-06-15',
    calificacion_calidad: 4,
    inspector_id: 'demo-user-id',
    inspector: { full_name: 'Demo Admin', role: 'admin' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    parcel: {
      id: 'p-1',
      display_id: 'P-0001',
      area_hectareas: 12.5,
      cultivo_principal: 'maiz',
      tipo_suelo: 'franco',
      farmer: { nombre_completo: 'Juan Pérez', farmer_cedula: 'V10395700', display_id: 'F-0001' },
    },
  },
  {
    id: 'i-2',
    display_id: 'I-0002',
    parcel_id: 'p-3',
    status: 'pendiente',
    estado: 'pendiente',
    scheduled_at: '2025-09-20',
    fecha_inspeccion: null,
    calificacion_calidad: null,
    inspector_id: 'demo-user-id',
    inspector: { full_name: 'Demo Admin', role: 'admin' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    parcel: {
      id: 'p-3',
      display_id: 'P-0003',
      area_hectareas: 4.8,
      cultivo_principal: 'arroz',
      tipo_suelo: 'arcilloso',
      farmer: { nombre_completo: 'María González', farmer_cedula: 'V20456789', display_id: 'F-0002' },
    },
  },
];

const inspectionService = {
  // Get inspections with filters
  getInspections: async (filters = {}) => {
    try {
      if (DEMO) {
        let data = demoInspections.map((x) => ({ ...x }));
        if (filters?.status) data = data.filter((i) => i.status === filters.status || i.estado === filters.status);
        if (filters?.inspector_id) data = data.filter((i) => i.inspector_id === filters.inspector_id);
        if (filters?.parcel_id) data = data.filter((i) => i.parcel_id === filters.parcel_id);
        if (filters?.farmer_cedula) data = data.filter((i) => i.parcel?.farmer?.farmer_cedula === filters.farmer_cedula);
        if (filters?.fecha_desde) data = data.filter((i) => !i.scheduled_at || i.scheduled_at >= filters.fecha_desde);
        if (filters?.fecha_hasta) data = data.filter((i) => !i.scheduled_at || i.scheduled_at <= filters.fecha_hasta);
        return { success: true, data };
      }
      let query = supabase
        .from('inspections')
        .select(`
          *,
          parcel:parcels!parcel_id(
            id, display_id, area_hectareas, cultivo_principal, tipo_suelo,
            farmer:farmers!farmer_cedula(nombre_completo, farmer_cedula, display_id)
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
      if (DEMO) {
        const found = demoInspections.find((i) => String(i.id) === String(inspectionId) || String(i.display_id) === String(inspectionId));
        if (!found) return { success: false, error: 'No encontrado' };
        return { success: true, data: { ...found } };
      }
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
      if (DEMO) {
        const id = `i-${Math.floor(Math.random()*100000)}`;
        const display_id = id.toUpperCase();
        const data = {
          id,
          display_id,
          status: inspectionData.status || 'pendiente',
          estado: inspectionData.status || 'pendiente',
          scheduled_at: inspectionData.scheduled_at || null,
          fecha_inspeccion: inspectionData.scheduled_at || null,
          calificacion_calidad: inspectionData.calificacion_calidad ?? null,
          inspector_id: inspectionData.inspector_id || 'demo-user-id',
          parcel_id: inspectionData.parcel_id,
          inspector: { full_name: 'Demo Admin' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          parcel: { id: inspectionData.parcel_id },
        };
        demoInspections.unshift(data);
        return { success: true, data };
      }
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
            farmer:farmers!farmer_cedula(nombre_completo, farmer_cedula)
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
      if (DEMO) {
        const idx = demoInspections.findIndex((i) => String(i.id) === String(inspectionId) || String(i.display_id) === String(inspectionId));
        if (idx === -1) return { success: false, error: 'No encontrado' };
        demoInspections[idx] = { ...demoInspections[idx], ...updates, updated_at: new Date().toISOString(), estado: updates.status || demoInspections[idx].estado };
        return { success: true, data: demoInspections[idx] };
      }
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
      if (DEMO) {
        const idx = demoInspections.findIndex((i) => String(i.id) === String(inspectionId) || String(i.display_id) === String(inspectionId));
        if (idx === -1) return { success: false, error: 'No encontrado' };
        demoInspections.splice(idx, 1);
        return { success: true };
      }
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
      if (DEMO) {
        const data = demoInspections;
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const stats = {
          total: data.length,
          by_status: {},
          this_month: data.filter((i) => new Date(i.scheduled_at || i.created_at) >= thisMonth).length,
          average_quality: 0,
          quality_distribution: {},
        };
        data.forEach((i) => {
          const status = i.status || i.estado;
          stats.by_status[status] = (stats.by_status[status] || 0) + 1;
          if (i.calificacion_calidad) {
            const q = i.calificacion_calidad;
            stats.quality_distribution[q] = (stats.quality_distribution[q] || 0) + 1;
          }
        });
        const qualityRatings = data.filter((i) => i.calificacion_calidad).map((i) => i.calificacion_calidad);
        if (qualityRatings.length) {
          stats.average_quality = qualityRatings.reduce((s, r) => s + r, 0) / qualityRatings.length;
        }
        return { success: true, data: stats };
      }
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
      if (DEMO) {
        const data = demoInspections.filter((i) => (i.status || i.estado) === 'pendiente');
        return { success: true, data };
      }
      const { data, error } = await supabase
        .from('inspections')
        .select(`
          *,
          parcel:parcels!parcel_id(
            id, area_hectareas, cultivo_principal, ubicacion_lat, ubicacion_lng,
            farmer:farmers!farmer_cedula(nombre_completo, farmer_cedula, telefono)
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
      if (DEMO) {
        const data = demoInspections.filter((i) => i.inspector_id === inspectorId);
        return { success: true, data };
      }
      const { data, error } = await supabase
        .from('inspections')
        .select(`
          *,
          parcel:parcels!parcel_id(
            id, area_hectareas, cultivo_principal,
            farmer:farmers!farmer_cedula(nombre_completo, farmer_cedula)
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