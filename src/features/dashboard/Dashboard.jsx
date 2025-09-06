import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RoleBasedSidebar from '../../components/layout/RoleBasedSidebar';
import NotificationCenter from '../../components/ui/NotificationCenter';
import UserMenu from '../../components/ui/UserMenu';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';

// Import dashboard components
import MetricsCard from './components/MetricsCard';
import FinancingStatusCard from './components/FinancingStatusCard';
import QuickActionsPanel from './components/QuickActionsPanel';
import ActivityTimeline from './components/ActivityTimeline';
import CropSuggestionWidget from './components/CropSuggestionWidget';

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentUser] = useState({
    id: 1,
    name: "Administrador",
    role: "admin",
    cedula: "V-12.345.678",
    email: "admin@siembrapais.com",
    permissions: ["view_dashboard", "manage_farmers", "manage_parcels", "manage_inspections", "manage_financing"]
  });

  // Mock data for dashboard metrics
  const [dashboardData, setDashboardData] = useState({
    metrics: {
      financingStatus: {
        value: "Bs. 125.000",
        subtitle: "Aprobado",
        trend: { direction: 'up', value: '+15%' }
      },
      activeParcels: {
        value: "3",
        subtitle: "Registradas",
        trend: null
      },
      pendingInspections: {
        value: "1",
        subtitle: "Programada",
        trend: null
      },
      upcomingPayments: {
        value: "Bs. 8.500",
        subtitle: "Próximo: 15 Ago",
        trend: null
      }
    },
    financing: {
      id: "FIN-2024-001",
      amount: 125000,
      status: "approved",
      requestDate: new Date('2024-07-10'),
      parcelName: "Parcela Norte - Maíz",
      observations: "Solicitud aprobada. Contrato disponible para descarga. Primer desembolso programado para el 30 de julio.",
      lastUpdate: "2 horas"
    },
    parcels: [
      {
        id: 1,
        name: "Parcela Norte",
        area: 5.2,
        soilType: "Arcilloso",
        primaryCrop: "Maíz",
        location: { lat: 10.4806, lng: -66.9036 }
      },
      {
        id: 2,
        name: "Parcela Sur",
        area: 3.8,
        soilType: "Franco",
        primaryCrop: "Frijol",
        location: { lat: 10.4756, lng: -66.8986 }
      },
      {
        id: 3,
        name: "Parcela Este",
        area: 2.1,
        soilType: "Arenoso",
        primaryCrop: "Yuca",
        location: { lat: 10.4856, lng: -66.8936 }
      }
    ],
    activities: [
      {
        id: 1,
        type: 'financing',
        title: 'Financiamiento Aprobado',
        description: 'Su solicitud de financiamiento FIN-2024-001 ha sido aprobada por Bs. 125.000',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'approved',
        metadata: 'Contrato disponible para descarga'
      },
      {
        id: 2,
        type: 'inspection',
        title: 'Inspección Completada',
        description: 'Inspección de Parcela Norte completada exitosamente',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        status: 'completed',
        metadata: 'Inspector: María González'
      },
      {
        id: 3,
        type: 'parcel',
        title: 'Parcela Registrada',
        description: 'Nueva parcela "Parcela Este" agregada al sistema',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: 'approved',
        metadata: '2.1 hectáreas - Cultivo: Yuca'
      },
      {
        id: 4,
        type: 'payment',
        title: 'Pago Programado',
        description: 'Próximo pago de Bs. 8.500 programado para el 15 de agosto',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'pending',
        metadata: 'Cuota 2 de 12'
      },
      {
        id: 5,
        type: 'notification',
        title: 'Recordatorio de Siembra',
        description: 'Época óptima para siembra de maíz en su región',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: 'under_review',
        metadata: 'Basado en condiciones climáticas'
      }
    ]
  });

  const handleQuickAction = (actionId) => {
    switch (actionId) {
      case 'request-financing':
        // Navigate to financing request form
        console.log('Navigating to financing request');
        break;
      case 'add-parcel': navigate('/parcel-management');
        break;
      case 'view-payments': console.log('Navigating to payments');
        break;
      case 'schedule-inspection': navigate('/inspection-workflow');
        break;
      default:
        console.log('Unknown action:', actionId);
    }
  };

  // Real-time updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time updates
      setDashboardData(prev => ({
        ...prev,
        activities: prev.activities.map(activity => ({
          ...activity,
          timestamp: activity.timestamp // Keep original timestamps
        }))
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <RoleBasedSidebar 
        user={currentUser}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Panel Principal
              </h1>
              <p className="text-muted-foreground">
                Bienvenido, {currentUser.name} • {new Date().toLocaleDateString('es-VE', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationCenter />
              <UserMenu user={currentUser} />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricsCard
              title="Estado de Financiamiento"
              value={dashboardData.metrics.financingStatus.value}
              subtitle={dashboardData.metrics.financingStatus.subtitle}
              icon="DollarSign"
              color="success"
              trend={dashboardData.metrics.financingStatus.trend}
            />
            <MetricsCard
              title="Parcelas Activas"
              value={dashboardData.metrics.activeParcels.value}
              subtitle={dashboardData.metrics.activeParcels.subtitle}
              icon="MapPin"
              color="primary"
            />
            <MetricsCard
              title="Inspecciones Pendientes"
              value={dashboardData.metrics.pendingInspections.value}
              subtitle={dashboardData.metrics.pendingInspections.subtitle}
              icon="ClipboardCheck"
              color="warning"
            />
            <MetricsCard
              title="Próximos Pagos"
              value={dashboardData.metrics.upcomingPayments.value}
              subtitle={dashboardData.metrics.upcomingPayments.subtitle}
              icon="CreditCard"
              color="accent"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column - Financing Status and Activity */}
            <div className="xl:col-span-2 space-y-8">
              {/* Financing Status Card */}
              <FinancingStatusCard financing={dashboardData.financing} />

              {/* Activity Timeline */}
              <ActivityTimeline activities={dashboardData.activities} />
            </div>

            {/* Right Column - Quick Actions and AI Suggestions */}
            <div className="space-y-8">
              {/* Quick Actions Panel */}
              <QuickActionsPanel onAction={handleQuickAction} />

              {/* AI Crop Suggestions */}
              <CropSuggestionWidget parcels={dashboardData.parcels} />
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Weather Widget */}
            <div className="bg-card border border-border rounded-lg p-6 card-elevation">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Condiciones Climáticas
                </h3>
                <Icon name="Cloud" size={20} className="text-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <Icon name="Sun" size={32} className="mx-auto text-accent mb-2" />
                  <p className="text-2xl font-bold text-foreground">28°C</p>
                  <p className="text-sm text-muted-foreground">Soleado</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Humedad:</span>
                    <span className="text-foreground">65%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Viento:</span>
                    <span className="text-foreground">12 km/h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Precipitación:</span>
                    <span className="text-foreground">0 mm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Market Prices */}
            <div className="bg-card border border-border rounded-lg p-6 card-elevation">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Precios de Mercado
                </h3>
                <Icon name="TrendingUp" size={20} className="text-success" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon name="Wheat" size={16} className="text-accent" />
                    <span className="text-sm text-foreground">Maíz (kg)</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">Bs. 2.50</p>
                    <p className="text-xs text-success">+5.2%</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon name="Leaf" size={16} className="text-success" />
                    <span className="text-sm text-foreground">Frijol (kg)</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">Bs. 4.80</p>
                    <p className="text-xs text-error">-2.1%</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon name="TreePine" size={16} className="text-warning" />
                    <span className="text-sm text-foreground">Yuca (kg)</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">Bs. 1.20</p>
                    <p className="text-xs text-success">+8.3%</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" fullWidth className="mt-4" iconName="ExternalLink">
                Ver más precios
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FarmerDashboard;