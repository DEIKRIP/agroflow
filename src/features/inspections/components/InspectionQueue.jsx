import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from "../../../contexts/AuthContext";
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import StatusBadgeSystem, { PriorityBadge } from '../../../components/ui/StatusBadgeSystem';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-hot-toast';
import { normalizeRole } from '../../../components/layout/RoleBasedSidebar';

const InspectionQueue = ({ onSelectInspection, selectedInspectionId, userRole: propUserRole = 'farmer', idFarmer: propIdFarmer = null }) => {
  // Get user from auth context
  const { user, userProfile } = useAuth();
  const email = String(user?.email || '').toLowerCase().trim();
  const isAdmin = email === 'manzanillamadriddeiker@gmail.com';
  const userRole = isAdmin ? 'admin' : (userProfile?.role || propUserRole);
  const idFarmer = userProfile?.id_farmer || propIdFarmer;
  
  console.log('InspectionQueue - User context:', {
    email,
    isAdmin,
    userRole,
    idFarmer
  });
  const [dbInspections, setDbInspections] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, scheduled, overdue
  const queryClient = useQueryClient();

  const fetchInspections = useCallback(async () => {
    let data, error;
    ({ data, error } = await supabase
      .from('inspections')
      .select(`
        id,
        status,
        scheduled_at,
        created_at,
        observations,
        parcels:parcel_id (
          id,
          name,
          surface_area,
          crop_type,
          location_lat,
          location_lng,
          farmer_id,
          farmers:farmer_id (
            id,
            full_name,
            profile_image_url
          )
        )
      `)
      .order('created_at', { ascending: false }));

    // Fallback: si falla el join o viene vacío, intenta consulta simple
    if (error || !Array.isArray(data) || data.length === 0) {
      console.warn('Inspections join query empty or error, falling back to simple select', error);
      const simple = await supabase
        .from('inspections')
        .select('id, status, scheduled_at, created_at, parcel_id, observations')
        .order('created_at', { ascending: false });
      if (!simple.error) {
        data = simple.data || [];
        error = null;
      } else {
        throw simple.error;
      }
    }

    const normalized = (data || []).map((row) => {
      const scheduledDate = new Date(row.scheduled_at || row.created_at);
      let uiStatus = 'pending';
      if (row.status === 'pendiente') uiStatus = 'pending';
      else if (row.status === 'programada' || row.status === 'en_progreso') uiStatus = 'scheduled';
      else if (row.status === 'completada') uiStatus = 'completed';
      else if (row.status === 'cancelada') uiStatus = 'cancelled';

      const now = new Date();
      const isOver = scheduledDate && scheduledDate < now && !['completed','cancelled'].includes(uiStatus);
      if (isOver && uiStatus === 'scheduled') {
        uiStatus = 'overdue';
      }

      // No hay columna priority en tu tabla; usar prioridad por defecto
      const uiPriority = 'medium';

      const parcel = row?.parcels || {};
      const farmer = parcel?.farmers || {};

      return {
        id: row.id,
        farmer: {
          name: farmer?.full_name || '—',
          cedula: '—',
          avatar: farmer?.profile_image_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        },
        parcel: {
          id: parcel?.id || row?.parcel_id || '—',
          location: '',
          area: parcel?.surface_area ?? null,
          crop: parcel?.crop_type || '',
          id_farmer: parcel?.farmer_id ?? null,
          coordinates: parcel?.location_lat != null && parcel?.location_lng != null
            ? { lat: parcel.location_lat, lng: parcel.location_lng }
            : null
        },
        inspection: {
          type: 'initial',
          priority: uiPriority,
          scheduledDate,
          inspector: '—',
          status: uiStatus
        }
      };
    });

    return normalized;
  }, []);

  const { data: inspections = [], isLoading, error } = useQuery({
    queryKey: ['inspections'],
    queryFn: fetchInspections,
    refetchOnWindowFocus: false
  });

  // Set up real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('inspections_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'inspections'
      }, (payload) => {
        queryClient.invalidateQueries(['inspections']);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [queryClient]);

  useEffect(() => {
    if (error) {
      toast.error('Error cargando inspecciones: ' + error.message);
    }
  }, [error]);

  const inspectionsMock = [
    {
      id: 1,
      farmer: {
        name: "Carlos Mendoza",
        cedula: "V-12345678",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
      },
      parcel: {
        id: "P-2024-001",
        location: "Barinas, Estado Barinas",
        area: 5.2,
        crop: "Maíz",
        coordinates: { lat: 8.6226, lng: -70.2070 }
      },
      inspection: {
        type: "initial",
        priority: "high",
        scheduledDate: new Date('2025-01-26'),
        inspector: "María González",
        status: "pending"
      }
    },
    {
      id: 2,
      farmer: {
        name: "Ana Rodríguez",
        cedula: "V-23456789",
        avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?w=150&h=150&fit=crop&crop=face"
      },
      parcel: {
        id: "P-2024-002",
        location: "Portuguesa, Estado Portuguesa",
        area: 8.7,
        crop: "Arroz",
        coordinates: { lat: 9.0419, lng: -69.7433 }
      },
      inspection: {
        type: "follow_up",
        priority: "medium",
        scheduledDate: new Date('2025-01-27'),
        inspector: "José Pérez",
        status: "scheduled"
      }
    },
    {
      id: 3,
      farmer: {
        name: "Luis Hernández",
        cedula: "V-34567890",
        avatar: "https://images.pixabay.com/photo/2016/11/21/12/42/beard-1845166_1280.jpg?w=150&h=150&fit=crop&crop=face"
      },
      parcel: {
        id: "P-2024-003",
        location: "Guárico, Estado Guárico",
        area: 12.3,
        crop: "Sorgo",
        coordinates: { lat: 8.1111, lng: -66.1167 }
      },
      inspection: {
        type: "final",
        priority: "urgent",
        scheduledDate: new Date('2025-01-24'),
        inspector: "Carmen Silva",
        status: "overdue"
      }
    },
    {
      id: 4,
      farmer: {
        name: "Rosa Martínez",
        cedula: "V-45678901",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616c9c0b8c5?w=150&h=150&fit=crop&crop=face"
      },
      parcel: {
        id: "P-2024-004",
        location: "Cojedes, Estado Cojedes",
        area: 6.8,
        crop: "Frijol",
        coordinates: { lat: 9.6617, lng: -68.5833 }
      },
      inspection: {
        type: "initial",
        priority: "medium",
        scheduledDate: new Date('2025-01-28'),
        inspector: "Roberto Díaz",
        status: "pending"
      }
    }
  ];

  // Remove duplicate manual loader to avoid duplicates; useQuery already provides normalized data

  const filteredInspections = useMemo(() => {
    let allInspections = [...inspections];
    // Admin can see all inspections
    if (isAdmin) {
      console.log('Admin access - showing all inspections');
      return allInspections;
    }
    // For non-admin users, filter by role
    const role = normalizeRole(userRole);
    // Con join a parcels, podemos filtrar por idFarmer si está disponible
    if (role === 'farmer' && idFarmer) {
      allInspections = allInspections.filter(insp => insp?.parcel?.id_farmer === idFarmer);
    }
    if (filter === 'all') return allInspections;
    return allInspections.filter(insp => {
      if (filter === 'pending') return insp.inspection.status === 'pending';
      if (filter === 'scheduled') return insp.inspection.status === 'scheduled';
      if (filter === 'overdue') return insp.inspection.status === 'overdue';
      return true;
    });
  }, [inspections, dbInspections, filter, userRole, idFarmer]);

  const getInspectionTypeLabel = (type) => {
    const types = {
      initial: 'Inicial',
      follow_up: 'Seguimiento',
      final: 'Final'
    };
    return types[type] || type;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-warning',
      scheduled: 'text-primary',
      overdue: 'text-error'
    };
    return colors[status] || 'text-muted-foreground';
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isOverdue = (date, status) => {
    return status === 'overdue' || (new Date() > date && status !== 'completed');
  };

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Cola de Inspecciones</h2>
          <span className="text-sm text-muted-foreground">
            {isLoading ? 'Cargando…' : `${filteredInspections.length} inspecciones`}
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-muted rounded-lg p-1">
          {[
            { key: 'all', label: 'Todas', count: filteredInspections.length },
            { key: 'pending', label: 'Pendientes', count: filteredInspections.filter(i => i.inspection.status === 'pending').length },
            { key: 'scheduled', label: 'Programadas', count: filteredInspections.filter(i => i.inspection.status === 'scheduled').length },
            { key: 'overdue', label: 'Vencidas', count: filteredInspections.filter(i => i.inspection.status === 'overdue').length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-md micro-interaction ${
                filter === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 text-xs opacity-75">({tab.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Inspection List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <Icon name="Loader" size={32} className="mx-auto text-muted-foreground mb-2 animate-spin" />
            <p className="text-muted-foreground">Cargando inspecciones...</p>
          </div>
        ) : filteredInspections.length === 0 ? (
          <div className="p-8 text-center">
            <Icon name="ClipboardList" size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No hay inspecciones {filter !== 'all' ? `${filter}s` : ''}</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredInspections.map((inspection) => (
              <div
                key={inspection.id}
                onClick={() => onSelectInspection(inspection)}
                className={`p-4 rounded-lg border cursor-pointer micro-interaction ${
                  selectedInspectionId === inspection.id
                    ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50 hover:bg-muted/50'
                } ${isOverdue(inspection.inspection.scheduledDate, inspection.inspection.status) ? 'border-l-4 border-l-error' : ''}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Image
                        src={inspection.farmer.avatar}
                        alt={inspection.farmer.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(inspection.inspection.status)} bg-current`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground text-sm">
                        {inspection.farmer.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {inspection.farmer.cedula}
                      </p>
                    </div>
                  </div>
                  <PriorityBadge priority={inspection.inspection.priority} className="text-xs" />
                </div>

                {/* Parcel Info */}
                <div className="mb-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Icon name="MapPin" size={14} className="text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">
                      {inspection.parcel.name || inspection.parcel.id}
                    </span>
                  </div>
                  {inspection.parcel.coordinates?.lat && inspection.parcel.coordinates?.lng && (
                    <p className="text-xs text-muted-foreground ml-5">
                      {inspection.parcel.coordinates.lat.toFixed(4)}, {inspection.parcel.coordinates.lng.toFixed(4)}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-1 ml-5">
                    <span className="text-xs text-muted-foreground">
                      {inspection.parcel.area} ha
                    </span>
                    {inspection.parcel.crop && (
                      <span className="text-xs text-muted-foreground">
                        {inspection.parcel.crop}
                      </span>
                    )}
                  </div>
                </div>

                {/* Inspection Details */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon name="Calendar" size={14} className="text-muted-foreground" />
                    <span className="text-xs text-foreground">
                      {formatDate(inspection.inspection.scheduledDate)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground capitalize">
                      {inspection.inspection.status}
                    </span>
                    <StatusBadgeSystem 
                      status={inspection.inspection.status === 'overdue' ? 'requires_action' : 'pending'} 
                      size="sm" 
                    />
                  </div>
                </div>

                {/* Inspector */}
                <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-border">
                  <Icon name="User" size={12} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Inspector: {inspection.inspection.inspector}
                  </span>
                  {inspection?.inspection?.notes && (
                    <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                      — {inspection.inspection.notes}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectionQueue;