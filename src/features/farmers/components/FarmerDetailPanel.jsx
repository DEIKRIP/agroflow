import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import StatusBadgeSystem from '../../../components/ui/StatusBadgeSystem';

const FarmerDetailPanel = ({ farmer, isOpen, onClose, userRole = 'admin' }) => {
  const [activeTab, setActiveTab] = useState('general');

  if (!isOpen || !farmer) return null;

  const formatCedula = (cedula) => {
    if (!cedula) return '';
    return cedula.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const tabs = [
    { id: 'general', label: 'Información General', icon: 'User' },
    { id: 'parcels', label: 'Parcelas', icon: 'MapPin' },
    { id: 'financing', label: 'Financiamiento', icon: 'DollarSign' },
    { id: 'inspections', label: 'Inspecciones', icon: 'ClipboardCheck' },
    { id: 'history', label: 'Historial', icon: 'Clock' }
  ];

  const renderGeneralInfo = () => (
    <div className="space-y-6">
      {/* Personal Information */}
      <div className="bg-white/90 rounded-lg p-4 shadow-md">
        <h4 className="font-semibold text-foreground mb-3 flex items-center">
          <Icon name="User" size={16} className="mr-2" />
          Información Personal
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">Nombre Completo</label>
            <p className="font-medium text-foreground">{farmer.name}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Cédula de Identidad</label>
            <p className="font-medium text-foreground">{formatCedula(farmer.cedula)}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">RIF</label>
            <p className="font-medium text-foreground">{farmer.rif || 'No registrado'}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Fecha de Nacimiento</label>
            <p className="font-medium text-foreground">
              {farmer.birthDate ? new Date(farmer.birthDate).toLocaleDateString('es-VE') : 'No registrada'}
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white/90 rounded-lg p-4 shadow-md">
        <h4 className="font-semibold text-foreground mb-3 flex items-center">
          <Icon name="Phone" size={16} className="mr-2" />
          Información de Contacto
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">Teléfono</label>
            <p className="font-medium text-foreground">{farmer.phone}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Email</label>
            <p className="font-medium text-foreground">{farmer.email}</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-muted-foreground">Dirección</label>
            <p className="font-medium text-foreground">{farmer.address || 'No registrada'}</p>
          </div>
        </div>
      </div>

      {/* Agricultural Information */}
      <div className="bg-white/90 rounded-lg p-4 shadow-md">
        <h4 className="font-semibold text-foreground mb-3 flex items-center">
          <Icon name="Sprout" size={16} className="mr-2" />
          Información Agrícola
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">Cultivo Principal</label>
            <p className="font-medium text-foreground">{farmer.primaryCrop}</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Área Total</label>
            <p className="font-medium text-foreground">{farmer.totalArea} hectáreas</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Experiencia</label>
            <p className="font-medium text-foreground">{farmer.experience || 'No especificada'} años</p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Tipo de Producción</label>
            <p className="font-medium text-foreground">{farmer.productionType || 'No especificado'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderParcels = () => (
    <div className="space-y-4">
      {farmer.parcels?.map((parcel, index) => (
        <div key={index} className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-foreground">Parcela #{parcel.code}</h4>
            <StatusBadgeSystem status={parcel.status} size="sm" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="text-xs text-muted-foreground">Área</label>
              <p className="font-medium text-foreground">{parcel.area} ha</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Tipo de Suelo</label>
              <p className="font-medium text-foreground">{parcel.soilType}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Cultivo</label>
              <p className="font-medium text-foreground">{parcel.crop}</p>
            </div>
          </div>
          <div className="mt-3">
            <label className="text-xs text-muted-foreground">Ubicación</label>
            <p className="font-medium text-foreground">{parcel.location}</p>
          </div>
        </div>
      )) || (
        <div className="text-center py-8">
          <Icon name="MapPin" size={32} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No hay parcelas registradas</p>
        </div>
      )}
    </div>
  );

  const renderFinancing = () => (
    <div className="space-y-4">
      {farmer.financingHistory?.map((financing, index) => (
        <div key={index} className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-foreground">
              Solicitud #{financing.requestId}
            </h4>
            <StatusBadgeSystem status={financing.status} size="sm" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-xs text-muted-foreground">Monto Solicitado</label>
              <p className="font-medium text-foreground">{formatCurrency(financing.requestedAmount)}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Monto Aprobado</label>
              <p className="font-medium text-foreground">
                {financing.approvedAmount ? formatCurrency(financing.approvedAmount) : 'Pendiente'}
              </p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Fecha de Solicitud</label>
              <p className="font-medium text-foreground">
                {new Date(financing.requestDate).toLocaleDateString('es-VE')}
              </p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Propósito</label>
              <p className="font-medium text-foreground">{financing.purpose}</p>
            </div>
          </div>
          {financing.observations && (
            <div className="mt-3">
              <label className="text-xs text-muted-foreground">Observaciones</label>
              <p className="text-sm text-foreground">{financing.observations}</p>
            </div>
          )}
        </div>
      )) || (
        <div className="text-center py-8">
          <Icon name="DollarSign" size={32} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No hay solicitudes de financiamiento</p>
        </div>
      )}
    </div>
  );

  const renderInspections = () => (
    <div className="space-y-4">
      {farmer.inspectionHistory?.map((inspection, index) => (
        <div key={index} className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-foreground">
              Inspección #{inspection.id}
            </h4>
            <StatusBadgeSystem status={inspection.status} size="sm" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-xs text-muted-foreground">Inspector</label>
              <p className="font-medium text-foreground">{inspection.inspector}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Fecha</label>
              <p className="font-medium text-foreground">
                {new Date(inspection.date).toLocaleDateString('es-VE')}
              </p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Tipo</label>
              <p className="font-medium text-foreground">{inspection.type}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Puntuación</label>
              <p className="font-medium text-foreground">{inspection.score}/100</p>
            </div>
          </div>
          {inspection.observations && (
            <div className="mt-3">
              <label className="text-xs text-muted-foreground">Observaciones</label>
              <p className="text-sm text-foreground">{inspection.observations}</p>
            </div>
          )}
        </div>
      )) || (
        <div className="text-center py-8">
          <Icon name="ClipboardCheck" size={32} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No hay inspecciones registradas</p>
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-4">
      {farmer.activityHistory?.map((activity, index) => (
        <div key={index} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
          <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <Icon name={activity.icon} size={14} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{activity.title}</p>
            <p className="text-xs text-muted-foreground">{activity.description}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(activity.timestamp).toLocaleString('es-VE')}
            </p>
          </div>
        </div>
      )) || (
        <div className="text-center py-8">
          <Icon name="Clock" size={32} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No hay actividad registrada</p>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralInfo();
      case 'parcels':
        return renderParcels();
      case 'financing':
        return renderFinancing();
      case 'inspections':
        return renderInspections();
      case 'history':
        return renderHistory();
      default:
        return renderGeneralInfo();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white rounded-l-2xl border-l border-border z-500 shadow-3xl overflow-y-auto p-8 flex flex-col pointer-events-auto" style={{ marginTop: '64px' }}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
                <Image
                  src={farmer.photo}
                  alt={`Foto de ${farmer.name}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{farmer.name}</h2>
                <p className="text-sm text-muted-foreground">C.I: {formatCedula(farmer.cedula)}</p>
                <div className="mt-1">
                  <StatusBadgeSystem status={farmer.status} size="sm" />
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              iconName="X"
            />
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border bg-muted/20 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary bg-primary/5' :'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon name={tab.icon} size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderTabContent()}
          </div>

          {/* Footer Actions */}
          {['admin', 'operator'].includes(userRole) && (
            <div className="p-6 border-t border-border bg-muted/30">
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  iconName="Calendar"
                  iconPosition="left"
                  className="flex-1"
                >
                  Programar Inspección
                </Button>
                <Button
                  variant="default"
                  iconName="DollarSign"
                  iconPosition="left"
                  className="flex-1"
                >
                  Procesar Financiamiento
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FarmerDetailPanel;