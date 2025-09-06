import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import StatusBadgeSystem from '../../../components/ui/StatusBadgeSystem';

const InspectionMap = ({ selectedInspection, onLocationUpdate }) => {
  const [mapView, setMapView] = useState('satellite'); // satellite, terrain, roadmap
  const [showInspectionPoints, setShowInspectionPoints] = useState(true);

  if (!selectedInspection) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <Icon name="Map" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Ubicación de Parcela
          </h3>
          <p className="text-muted-foreground">
            Selecciona una inspección para ver la ubicación
          </p>
        </div>
      </div>
    );
  }

  const { parcel } = selectedInspection;
  const mapSrc = `https://www.google.com/maps?q=${parcel.coordinates.lat},${parcel.coordinates.lng}&z=16&output=embed&maptype=${mapView}`;

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Ubicación de Parcela
            </h3>
            <p className="text-sm text-muted-foreground">
              {parcel.id} - {parcel.location}
            </p>
          </div>
          <StatusBadgeSystem 
            status={selectedInspection.inspection.status} 
            size="sm" 
          />
        </div>

        {/* Map Controls */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-1 bg-muted rounded-lg p-1">
            {[
              { key: 'roadmap', label: 'Mapa', icon: 'Map' },
              { key: 'satellite', label: 'Satélite', icon: 'Satellite' },
              { key: 'terrain', label: 'Terreno', icon: 'Mountain' }
            ].map(view => (
              <button
                key={view.key}
                onClick={() => setMapView(view.key)}
                className={`flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded-md micro-interaction ${
                  mapView === view.key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon name={view.icon} size={12} />
                <span>{view.label}</span>
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInspectionPoints(!showInspectionPoints)}
            iconName={showInspectionPoints ? "EyeOff" : "Eye"}
            iconPosition="left"
          >
            {showInspectionPoints ? 'Ocultar' : 'Mostrar'} Puntos
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <iframe
          width="100%"
          height="100%"
          loading="lazy"
          title={`Parcela ${parcel.id}`}
          referrerPolicy="no-referrer-when-downgrade"
          src={mapSrc}
          className="border-0"
        />

        {/* Overlay Information */}
        <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-elevation-2">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Icon name="MapPin" size={14} className="text-primary" />
              <span className="text-sm font-medium text-foreground">
                {parcel.id}
              </span>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Área: {parcel.area} hectáreas</div>
              <div>Cultivo: {parcel.crop}</div>
              <div>Coordenadas: {parcel.coordinates.lat}, {parcel.coordinates.lng}</div>
            </div>
          </div>
        </div>

        {/* Inspection Points Overlay */}
        {showInspectionPoints && (
          <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-elevation-2 max-w-xs">
            <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
              <Icon name="Target" size={14} className="mr-2" />
              Puntos de Inspección
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Entrada Principal</span>
                <div className="w-2 h-2 bg-primary rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Área de Cultivo Norte</span>
                <div className="w-2 h-2 bg-success rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sistema de Riego</span>
                <div className="w-2 h-2 bg-accent rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Almacenamiento</span>
                <div className="w-2 h-2 bg-secondary rounded-full" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Parcel Information */}
      <div className="p-4 border-t border-border">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">
              Información de la Parcela
            </h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>Superficie: {parcel.area} hectáreas</div>
              <div>Cultivo Principal: {parcel.crop}</div>
              <div>Ubicación: {parcel.location}</div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">
              Estado de Inspección
            </h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>Tipo: {selectedInspection.inspection.type === 'initial' ? 'Inicial' : 
                           selectedInspection.inspection.type === 'follow_up' ? 'Seguimiento' : 'Final'}</div>
              <div>Inspector: {selectedInspection.inspection.inspector}</div>
              <div>Fecha: {selectedInspection.inspection.scheduledDate.toLocaleDateString('es-VE')}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            iconName="Navigation"
            iconPosition="left"
            className="flex-1"
          >
            Obtener Direcciones
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="Share"
            iconPosition="left"
            className="flex-1"
          >
            Compartir Ubicación
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InspectionMap;