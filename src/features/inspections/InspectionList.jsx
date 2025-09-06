import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleBasedSidebar from '../../components/layout/RoleBasedSidebar';
import NotificationCenter from '../../components/ui/NotificationCenter';
import SearchFilterBar from '../../components/ui/SearchFilterBar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import InspectionQueue from './components/InspectionQueue';
import InspectionForm from './components/InspectionForm';
import InspectionHistory from './components/InspectionHistory';
import InspectionMap from './components/InspectionMap';

const InspectionWorkflow = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [activePanel, setActivePanel] = useState('form'); // form, history, map
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Mock user data
  const user = {
    role: 'operator',
    permissions: ['view_inspections', 'create_inspections', 'approve_inspections']
  };

  // Filter configuration for search bar
  const filterConfig = [
    {
      key: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'pending', label: 'Pendiente' },
        { value: 'scheduled', label: 'Programada' },
        { value: 'overdue', label: 'Vencida' },
        { value: 'completed', label: 'Completada' }
      ],
      placeholder: 'Seleccionar estado'
    },
    {
      key: 'type',
      label: 'Tipo de Inspección',
      type: 'select',
      options: [
        { value: 'initial', label: 'Inicial' },
        { value: 'follow_up', label: 'Seguimiento' },
        { value: 'final', label: 'Final' }
      ],
      placeholder: 'Seleccionar tipo'
    },
    {
      key: 'priority',
      label: 'Prioridad',
      type: 'select',
      options: [
        { value: 'low', label: 'Baja' },
        { value: 'medium', label: 'Media' },
        { value: 'high', label: 'Alta' },
        { value: 'urgent', label: 'Urgente' }
      ],
      placeholder: 'Seleccionar prioridad'
    },
    {
      key: 'inspector',
      label: 'Inspector',
      type: 'select',
      options: [
        { value: 'maria_gonzalez', label: 'María González' },
        { value: 'jose_perez', label: 'José Pérez' },
        { value: 'carmen_silva', label: 'Carmen Silva' },
        { value: 'roberto_diaz', label: 'Roberto Díaz' }
      ],
      placeholder: 'Seleccionar inspector'
    },
    {
      key: 'dateRange',
      label: 'Rango de Fechas',
      type: 'daterange',
      placeholder: 'Seleccionar fechas'
    }
  ];

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle inspection selection
  const handleSelectInspection = (inspection) => {
    setSelectedInspection(inspection);
    if (isMobile) {
      setActivePanel('form');
    }
  };

  // Handle form actions
  const handleSaveInspection = (formData) => {
    console.log('Saving inspection:', formData);
    // Implement save logic
  };

  const handleSubmitInspection = (formData) => {
    console.log('Submitting inspection for review:', formData);
    // Implement submit logic
  };

  const handleApproveInspection = (formData) => {
    console.log('Approving inspection:', formData);
    // Implement approval logic
  };

  const handleRejectInspection = (formData) => {
    console.log('Rejecting inspection:', formData);
    // Implement rejection logic
  };

  // Handle search and filters
  const handleSearch = (term) => {
    setSearchTerm(term);
    console.log('Searching:', term);
  };

  const handleFilter = (filterValues) => {
    setFilters(filterValues);
    console.log('Filtering:', filterValues);
  };

  // Panel navigation for mobile
  const panels = [
    { key: 'queue', label: 'Cola', icon: 'List' },
    { key: 'form', label: 'Formulario', icon: 'ClipboardCheck' },
    { key: 'history', label: 'Historial', icon: 'History' },
    { key: 'map', label: 'Mapa', icon: 'Map' }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <RoleBasedSidebar
        user={user}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'}`}>
        {/* Header */}
        <header className="bg-card border-b border-border px-4 py-3 md:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  iconName="Menu"
                />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  Flujo de Trabajo de Inspecciones
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gestiona y realiza inspecciones de parcelas agrícolas
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <NotificationCenter />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/farmer-dashboard')}
                iconName="LayoutDashboard"
                iconPosition="left"
              >
                Panel Principal
              </Button>
            </div>
          </div>

          {/* Mobile Panel Navigation */}
          {isMobile && (
            <div className="flex space-x-1 mt-4 bg-muted rounded-lg p-1">
              {panels.map(panel => (
                <button
                  key={panel.key}
                  onClick={() => setActivePanel(panel.key)}
                  className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 text-xs font-medium rounded-md micro-interaction ${
                    activePanel === panel.key
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon name={panel.icon} size={14} />
                  <span>{panel.label}</span>
                </button>
              ))}
            </div>
          )}
        </header>

        {/* Search and Filters */}
        <div className="p-4 md:p-6">
          <SearchFilterBar
            onSearch={handleSearch}
            onFilter={handleFilter}
            filters={filterConfig}
            searchPlaceholder="Buscar inspecciones por agricultor, parcela o inspector..."
            showAdvancedFilters={true}
            initialValues={{ search: searchTerm, filters }}
          />
        </div>

        {/* Main Content Area */}
        <div className="px-4 pb-4 md:px-6 md:pb-6">
          {isMobile ? (
            // Mobile: Single Panel View
            <div className="bg-card rounded-lg border border-border overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
              {activePanel === 'queue' && (
                <InspectionQueue
                  onSelectInspection={handleSelectInspection}
                  selectedInspectionId={selectedInspection?.id}
                />
              )}
              {activePanel === 'form' && (
                <InspectionForm
                  inspection={selectedInspection}
                  onSave={handleSaveInspection}
                  onSubmit={handleSubmitInspection}
                  onApprove={handleApproveInspection}
                  onReject={handleRejectInspection}
                />
              )}
              {activePanel === 'history' && (
                <InspectionHistory selectedInspection={selectedInspection} />
              )}
              {activePanel === 'map' && (
                <InspectionMap selectedInspection={selectedInspection} />
              )}
            </div>
          ) : (
            // Desktop: Three Panel Layout
            <div className="grid grid-cols-12 gap-6" style={{ height: 'calc(100vh - 280px)' }}>
              {/* Left Panel - Inspection Queue */}
              <div className="col-span-3">
                <div className="bg-card rounded-lg border border-border overflow-hidden h-full">
                  <InspectionQueue
                    onSelectInspection={handleSelectInspection}
                    selectedInspectionId={selectedInspection?.id}
                  />
                </div>
              </div>

              {/* Center Panel - Inspection Form */}
              <div className="col-span-6">
                <div className="bg-card rounded-lg border border-border overflow-hidden h-full">
                  <InspectionForm
                    inspection={selectedInspection}
                    onSave={handleSaveInspection}
                    onSubmit={handleSubmitInspection}
                    onApprove={handleApproveInspection}
                    onReject={handleRejectInspection}
                  />
                </div>
              </div>

              {/* Right Panel - History and Map */}
              <div className="col-span-3">
                <div className="h-full space-y-4">
                  {/* Panel Toggle */}
                  <div className="flex space-x-1 bg-muted rounded-lg p-1">
                    <button
                      onClick={() => setActivePanel('history')}
                      className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium rounded-md micro-interaction ${
                        activePanel === 'history' ?'bg-background text-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon name="History" size={14} />
                      <span>Historial</span>
                    </button>
                    <button
                      onClick={() => setActivePanel('map')}
                      className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium rounded-md micro-interaction ${
                        activePanel === 'map' ?'bg-background text-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon name="Map" size={14} />
                      <span>Mapa</span>
                    </button>
                  </div>

                  {/* Panel Content */}
                  <div className="bg-card rounded-lg border border-border overflow-hidden flex-1" style={{ height: 'calc(100% - 48px)' }}>
                    {activePanel === 'history' ? (
                      <InspectionHistory selectedInspection={selectedInspection} />
                    ) : (
                      <InspectionMap selectedInspection={selectedInspection} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InspectionWorkflow;