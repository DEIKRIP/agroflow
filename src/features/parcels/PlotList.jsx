import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import RoleBasedSidebar from '../../components/layout/RoleBasedSidebar';
import NotificationCenter from '../../components/ui/NotificationCenter';
import ParcelMap from './components/ParcelMap';
import ParcelCard from './components/ParcelCard';
import ParcelFilters from './components/ParcelFilters';
import AddParcelModal from './components/AddParcelModal';
import { useAuth } from '../../contexts/AuthContext';
import parcelService from '../../utils/parcelService';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

const ParcelManagement = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [parcels, setParcels] = useState([]);
  const [filteredParcels, setFilteredParcels] = useState([]);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('es');
  const [inspectionRequested, setInspectionRequested] = useState({}); // parcelId -> true

  const { userProfile } = useAuth();
  const normalizeRole = (r) => {
    switch (String(r || '').toLowerCase().trim()) {
      case 'admin':
      case 'administrator':
        return 'admin';
      case 'operador':
      case 'operator':
        return 'operator';
      case 'agricultor':
      case 'farmer':
      case 'productor':
      case 'producer':
        return 'farmer';
      default:
        return 'farmer';
    }
  };
  const userRole = normalizeRole(userProfile?.role);
  const farmerCedula = userProfile?.farmer_cedula || null; // legacy fallback

  const [farmers, setFarmers] = useState([]);

  // Load language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('siembrapais_language') || 'es';
    setCurrentLanguage(savedLanguage);
  }, []);

  useEffect(() => {
    const loadParcels = async () => {
      try {
        setIsLoading(true);
        const idFarmer = userProfile?.id_farmer || userProfile?.farmer_id || null; // prefer new ids
        const filters = (userRole === 'farmer')
          ? (idFarmer ? { id_farmer: idFarmer } : (farmerCedula ? { farmer_cedula: farmerCedula } : {}))
          : {};
        const res = await parcelService.getParcels(filters);
        if (!res.success) throw new Error(res.error);
        const mapped = (res.data || []).map(p => ({
          id: p.id,
          name: p.name || p.nombre || `Parcela ${p.display_id || ''}`,
          // Prefer new schema farmer_id; fallback to legacy farmer_cedula
          farmerId: p.farmer_id || p.farmer_cedula || p.farmerId || null,
          farmerName: p.farmer?.full_name || p.farmer?.nombre_completo || p.farmer_name || p.farmer_cedula || '—',
          farmerAvatar: p.farmer?.profile_image_url || null,
          latitude: p.lat ?? p.location_lat ?? p.latitude ?? p.ubicacion_lat ?? null,
          longitude: p.lng ?? p.location_lng ?? p.longitude ?? p.ubicacion_lng ?? null,
          area: p.area_hectares ?? p.surface_area ?? p.area_hectareas ?? p.area ?? null,
          soilType: p.soil_type || p.tipo_suelo || null,
          primaryCrop: p.primary_crop ?? p.crop_type ?? p.cultivo_principal ?? null,
          status: (typeof p.is_active === 'boolean') ? (p.is_active ? 'Activo' : 'Inactivo') : (p.status || p.estado || 'Activo'),
          plantingDate: p.planting_date || p.fecha_siembra || null,
          lastInspection: p.inspections?.[0]?.fecha_inspeccion || p.last_inspection || null,
          createdAt: p.created_at,
          updatedAt: p.updated_at || null
        }));
        setParcels(mapped);
        setFilteredParcels(mapped);
      } catch (e) {
        console.error('Error loading parcels:', e);
        setParcels([]);
        setFilteredParcels([]);
      } finally {
        setIsLoading(false);
      }
    };
    if (userProfile) loadParcels();
  }, [userProfile]);

  // Load farmers for admin/operator selector
  useEffect(() => {
    const loadFarmers = async () => {
      if (userRole === 'farmer') return;
      try {
        const { data, error } = await supabase
          .from('farmers')
          .select('id, user_id, full_name, cedula');

        if (error) {
          console.error('Error loading farmers:', error);
          toast.error('No se pudieron cargar los agricultores');
        }

        let list = data || [];
        // Ordenar en cliente si contamos con full_name
        list = Array.isArray(list)
          ? [...list].sort((a,b) => String(a.full_name||'').localeCompare(String(b.full_name||'')))
          : [];

        // Fallback: si aún no existen filas en farmers, intentamos con users_profiles (rol productor)
        if (!error && (!list || list.length === 0)) {
          const { data: up, error: err2 } = await supabase
            .from('users_profiles')
            .select('id, full_name, role')
            .eq('role', 'productor');

          if (err2) {
            console.warn('Fallback users_profiles failed:', err2);
          } else if (up && up.length > 0) {
            list = (up || []).sort((a,b)=>String(a.full_name||'').localeCompare(String(b.full_name||''))).map((u) => ({
              id: u.id, // usamos el id de user como identificador temporal
              user_id: u.id,
              full_name: u.full_name,
              nombre_completo: u.full_name,
              cedula: null,
              farmer_cedula: null,
            }));
          }
        }

        setFarmers(list || []);
      } catch (e) {
        console.error('Unexpected error loading farmers:', e);
        toast.error('Ocurrió un error al cargar agricultores');
        setFarmers([]);
      }
    };
    loadFarmers();
  }, [userRole]);

  // Handle filters change
  const handleFilterChange = (filters) => {
    let filtered = [...parcels];
    
    if (filters.status) {
      filtered = filtered.filter(parcel => parcel.status === filters.status);
    }
    
    if (filters.farmerId) {
      filtered = filtered.filter(parcel => parcel.farmerId === filters.farmerId);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(parcel => 
        (parcel.name && parcel.name.toLowerCase().includes(searchLower)) ||
        (parcel.id && parcel.id.toLowerCase().includes(searchLower)) ||
        (parcel.primaryCrop && parcel.primaryCrop.toLowerCase().includes(searchLower)) ||
        (parcel.farmerName && parcel.farmerName.toLowerCase().includes(searchLower))
      );
    }
    
    setFilteredParcels(filtered);
    
    // Si hay una parcela seleccionada que ya no está en los resultados filtrados, la deseleccionamos
    if (selectedParcel && !filtered.some(p => p.id === selectedParcel.id)) {
      setSelectedParcel(null);
    }
  };

  const handleClearFilters = () => {
    setFilteredParcels(parcels);
  };

  const handleEditParcel = (parcel) => {
    // Actualizar la parcela en la lista
    const updatedParcels = parcels.map(p => 
      p.id === parcel.id ? { ...p, ...parcel } : p
    );
    
    setParcels(updatedParcels);
    
    // Actualizar la lista filtrada
    setFilteredParcels(updatedParcels.filter(p => 
      filteredParcels.some(fp => fp.id === p.id)
    ));
    
    // Si la parcela editada es la seleccionada, actualizarla
    if (selectedParcel && selectedParcel.id === parcel.id) {
      setSelectedParcel({ ...selectedParcel, ...parcel });
    }
  };

  const handleRequestInspection = async (parcel) => {
    const notes = JSON.stringify({
      farmer_cedula: parcel.farmerId,
      farmer_name: parcel.farmerName,
      parcel_name: parcel.name,
      area_hectareas: parcel.area,
      cultivo_principal: parcel.primaryCrop,
    });
    const res = await parcelService.requestInspection({ parcel_id: parcel.id, notes });
    if (res.success) {
      toast.success('Inspección solicitada');
      setInspectionRequested(prev => ({ ...prev, [parcel.id]: true }));
      // Opcional: actualizar campo de última inspección en UI
      setParcels(prev => prev.map(p => p.id === parcel.id ? { ...p, lastInspection: new Date().toISOString() } : p));
      setFilteredParcels(prev => prev.map(p => p.id === parcel.id ? { ...p, lastInspection: new Date().toISOString() } : p));
    } else {
      toast.error(res.error || 'No se pudo solicitar la inspección');
    }
  };

  const handleViewHistory = (parcel) => {
    console.log('View history for parcel:', parcel);
    // Implementation for history view
  };

  const handleAddParcel = async (payload) => {
    // Asegurar farmer_id para rol agricultor
    const enriched = { ...payload };
    try {
      if (userRole === 'farmer' && !enriched.farmer_id) {
        const idFarmer = userProfile?.id_farmer || userProfile?.farmer_id || null;
        if (idFarmer) {
          enriched.farmer_id = idFarmer;
        } else {
          toast.error('No se pudo determinar el agricultor asociado. Completa tu perfil e inténtalo nuevamente.');
          return;
        }
      }
    } catch (_) {}

    const res = await parcelService.createParcel(enriched);
    if (!res.success) {
      toast.error(res.error || 'No se pudo crear la parcela');
      return;
    }
    toast.success('Parcela creada correctamente');
    // refresh list
    const filters = (userRole === 'farmer' && farmerCedula) ? { farmer_cedula: farmerCedula } : {};
    const list = await parcelService.getParcels(filters);
    if (list.success) {
      const mapped = (list.data || []).map(p => ({
        id: p.id,
        name: p.nombre || `Parcela ${p.display_id || ''}`,
        farmerId: p.farmer_cedula,
        farmerName: p.farmer?.nombre_completo || p.farmer_cedula,
        farmerAvatar: p.farmer?.profile_image_url || null,
        latitude: p.ubicacion_lat,
        longitude: p.ubicacion_lng,
        area: p.area_hectareas,
        soilType: p.tipo_suelo,
        primaryCrop: p.cultivo_principal,
        status: p.estado || 'Activo',
        plantingDate: p.fecha_siembra,
        lastInspection: p.inspections?.[0]?.fecha_inspeccion || null,
        createdAt: p.created_at
      }));
      setParcels(mapped);
      setFilteredParcels(mapped);
      // Seleccionar la nueva parcela creada
      const createdId = res.data?.id;
      if (createdId) {
        const created = mapped.find(p => p.id === createdId);
        setSelectedParcel(created || mapped[0] || null);
      } else {
        setSelectedParcel(mapped[0] || null);
      }
    }
    setShowAddModal(false);
  };

  // Handle parcel selection
  const handleParcelSelect = (parcel) => {
    if (parcel && parcel.id === selectedParcel?.id) {
      // Si se hace clic en la misma parcela, la deseleccionamos
      setSelectedParcel(null);
    } else {
      // Seleccionamos la nueva parcela
      setSelectedParcel(parcel);
      
      // Desplazamos la vista para mostrar la tarjeta seleccionada
      if (parcel) {
        const element = document.getElementById(`parcel-${parcel.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  const getStatsData = () => {
    const total = parcels.length;
    const active = parcels.filter(p => p.status === 'Activo').length;
    const inPreparation = parcels.filter(p => p.status === 'En Preparación').length;
    const harvested = parcels.filter(p => p.status === 'Cosechado').length;
    const totalArea = parcels.reduce((sum, p) => sum + parseFloat(p.area), 0);

    return { total, active, inPreparation, harvested, totalArea };
  };

  const stats = getStatsData();

  return (
    <div className="min-h-screen bg-background">
      <RoleBasedSidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'}`}>
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                <button 
                  onClick={() => navigate('/farmer-dashboard')}
                  className="hover:text-foreground micro-transition"
                >
                  Panel Principal
                </button>
                <Icon name="ChevronRight" size={14} />
                <span className="text-foreground">Gestión de Parcelas</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">Gestión de Parcelas</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <NotificationCenter />
              <Button
                iconName="Plus"
                iconPosition="left"
                onClick={() => setShowAddModal(true)}
              >
                Agregar Parcela
              </Button>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon name="MapPin" size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Parcelas</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <Icon name="CheckCircle" size={20} className="text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                  <p className="text-sm text-muted-foreground">Activas</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Icon name="Clock" size={20} className="text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.inPreparation}</p>
                  <p className="text-sm text-muted-foreground">En Preparación</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon name="Package" size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.harvested}</p>
                  <p className="text-sm text-muted-foreground">Cosechadas</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Icon name="Ruler" size={20} className="text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalArea.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">Hectáreas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <ParcelFilters
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            className="mb-6"
          />

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left column - Map (más pequeño) */}
            <div className="w-full lg:w-1/2 xl:w-2/5">
              <ParcelMap 
                parcels={filteredParcels}
                selectedParcel={selectedParcel}
                onParcelSelect={handleParcelSelect}
                className="h-[600px]"
              />
              
              {/* Selected Parcel Details */}
              {selectedParcel && (
                <div className="mt-4 p-4 bg-card border border-border rounded-lg">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Detalles de la Parcela</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Nombre:</p>
                      <p className="font-medium">{selectedParcel.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Agricultor:</p>
                      <p className="font-medium">{selectedParcel.farmerName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cultivo Principal:</p>
                      <p className="font-medium">{selectedParcel.primaryCrop || 'No especificado'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Área:</p>
                      <p className="font-medium">{selectedParcel.area} ha</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Estado:</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedParcel.status === 'Activo' ? 'bg-green-100 text-green-800' :
                        selectedParcel.status === 'En Preparación' ? 'bg-yellow-100 text-yellow-800' :
                        selectedParcel.status === 'Cosechado' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedParcel.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right column - Parcels List (más ancha) */}
            <div className="w-full lg:w-1/2 xl:w-3/5 bg-card rounded-lg overflow-hidden border border-border">
              <div className="bg-card border border-border rounded-lg">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">
                    Parcelas Registradas ({filteredParcels.length})
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      iconName="Download"
                      iconPosition="left"
                    >
                      Exportar
                    </Button>
                  </div>
                </div>

                <div className="p-4">
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse">
                          <div className="bg-muted rounded-lg h-48"></div>
                        </div>
                      ))}
                    </div>
                  ) : filteredParcels.length === 0 ? (
                    <div className="text-center py-12">
                      <Icon name="MapPin" size={48} className="mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No hay parcelas</h3>
                      <p className="text-muted-foreground mb-4">
                        No se encontraron parcelas que coincidan con los filtros aplicados.
                      </p>
                      <Button
                        iconName="Plus"
                        iconPosition="left"
                        onClick={() => setShowAddModal(true)}
                      >
                        Agregar Primera Parcela
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto">
                      {filteredParcels.map(parcel => (
                        <div 
                          key={parcel.id} 
                          id={`parcel-${parcel.id}`}
                          className={`transition-all duration-200 ${selectedParcel?.id === parcel.id ? 'ring-2 ring-primary rounded-lg' : ''}`}
                        >
                          <ParcelCard
                            parcel={parcel}
                            isSelected={selectedParcel?.id === parcel.id}
                            onSelect={() => handleParcelSelect(parcel)}
                            onEdit={handleEditParcel}
                            onRequestInspection={handleRequestInspection}
                            onViewHistory={handleViewHistory}
                            userRole={userRole}
                            inspectionRequested={!!inspectionRequested[parcel.id]}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Parcel Modal */}
      <AddParcelModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddParcel}
        farmers={farmers}
        userRole={userRole}
        farmerCedula={farmerCedula}
      />
    </div>
  );
};

export default ParcelManagement;