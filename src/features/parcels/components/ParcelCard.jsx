import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import StatusBadgeSystem from '../../../components/ui/StatusBadgeSystem';
import { useCreateInspection } from '../../../hooks/useCreateInspection';
import toast from 'react-hot-toast';

const ParcelCard = ({ 
  parcel, 
  isSelected = false,
  onSelect,
  onEdit, 
  onRequestInspection, 
  onViewHistory, 
  userRole = 'farmer',
  inspectionRequested = false
}) => {
  const createInspection = useCreateInspection();

  const handleRequestInspection = async () => {
    if (inspectionRequested || createInspection.isPending) return;
    try {
      const payload = {
        parcel_id: parcel.id,
        priority: 'media',
        metadata: {
          trigger: 'from_parcel_card',
          source_ui: 'parcel_card',
          parcel_snapshot: {
            code: parcel.code || String(parcel.id),
            area_ha: parcel.area ?? parcel.area_hectareas ?? null,
            cultivo: parcel.primaryCrop || parcel.cultivo_principal || null,
            coords: [parcel.latitude ?? parcel.ubicacion_lat ?? null, parcel.longitude ?? parcel.ubicacion_lng ?? null]
          }
        }
      };
      const result = await createInspection.mutateAsync(payload);
      toast.success('Inspección solicitada correctamente');
      if (typeof onRequestInspection === 'function') {
        onRequestInspection(parcel, result);
      }
    } catch (err) {
      toast.error(err?.message || 'No se pudo solicitar la inspección');
    }
  };
  const getSoilTypeIcon = (soilType) => {
    const icons = {
      'Arcilloso': 'Mountain',
      'Arenoso': 'Waves',
      'Franco': 'TreePine',
      'Limoso': 'Droplets',
      'Orgánico': 'Leaf'
    };
    return icons[soilType] || 'Circle';
  };

  const getCropIcon = (crop) => {
    const icons = {
      'Maíz': 'Wheat',
      'Arroz': 'Wheat',
      'Frijol': 'Leaf',
      'Yuca': 'TreePine',
      'Plátano': 'TreePine',
      'Café': 'Coffee',
      'Cacao': 'Coffee',
      'Tomate': 'Apple',
      'Cebolla': 'Circle',
      'Ají': 'Flame'
    };
    return icons[crop] || 'Sprout';
  };

  const getStatusBadgeStatus = (status) => {
    const statusMap = {
      'Activo': 'approved',
      'En Preparación': 'pending',
      'Cosechado': 'completed',
      'Inactivo': 'cancelled'
    };
    return statusMap[status] || 'pending';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No registrada';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCoordinates = (lat, lng) => {
    if (lat == null || lng == null || isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
      return 'Sin coordenadas';
    }
    return `${parseFloat(lat).toFixed(4)}°, ${parseFloat(lng).toFixed(4)}°`;
  };

  // Roles reales en la app: 'admin', 'operador', 'productor'
  const canEdit = userRole === 'admin' || userRole === 'productor';
  const canRequestInspection = userRole === 'admin' || userRole === 'operador';
  const canViewHistory = true;

  const handleCardClick = (e) => {
    // Evitar que el clic en los botones active la selección
    if (e.target.closest('button, a')) return;
    if (onSelect) onSelect();
  };

  return (
    <div 
      className={`bg-card border rounded-lg p-6 transition-all duration-200 ${
        isSelected 
          ? 'border-primary ring-2 ring-primary ring-opacity-50' 
          : 'border-border hover:border-primary/50 hover:shadow-card-elevation'
      } cursor-pointer micro-interaction`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick(e)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isSelected ? 'bg-primary/20' : 'bg-primary/10'
          }`}>
            <Icon 
              name="MapPin" 
              size={20} 
              className={isSelected ? 'text-primary' : 'text-primary/70'} 
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{parcel.name}</h3>
            <p className="text-sm text-muted-foreground">ID: {parcel.id}</p>
          </div>
        </div>
        <StatusBadgeSystem 
          status={getStatusBadgeStatus(parcel.status)} 
          size="default"
          animated={parcel.status === 'En Preparación'}
        />
      </div>

      {/* Location Info with hover effect */}
      <div className="relative group">
        {isSelected && (
          <div className="absolute -inset-1 bg-primary/10 rounded-lg -z-10" />
        )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Icon name="Navigation" size={16} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Coordenadas</p>
              <p className="text-xs text-muted-foreground">
                {formatCoordinates(parcel.latitude, parcel.longitude)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Icon name="Ruler" size={16} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Área</p>
              <p className="text-xs text-muted-foreground">{parcel.area} hectáreas</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Icon name={getSoilTypeIcon(parcel.soilType)} size={16} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Tipo de Suelo</p>
              <p className="text-xs text-muted-foreground">{parcel.soilType}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Icon name={getCropIcon(parcel.primaryCrop)} size={16} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Cultivo Principal</p>
              <p className="text-xs text-muted-foreground">{parcel.primaryCrop}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="border-t border-border pt-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Icon name="Calendar" size={16} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Fecha de Siembra</p>
              <p className="text-xs text-muted-foreground">{formatDate(parcel.plantingDate)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Icon name="ClipboardCheck" size={16} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Última Inspección</p>
              <p className="text-xs text-muted-foreground">{formatDate(parcel.lastInspection)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Farmer Info */}
      <div className="bg-muted/50 rounded-lg p-3 mb-4">
        <div className="flex items-center space-x-2">
          <Icon name="User" size={16} className="text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">Agricultor</p>
            <p className="text-xs text-muted-foreground">{parcel.farmerName}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            iconName="Edit"
            iconPosition="left"
            onClick={() => onEdit && onEdit(parcel)}
          >
            Editar
          </Button>
        )}
        
        {canRequestInspection && (
          <Button
            variant={inspectionRequested ? 'default' : 'secondary'}
            size="sm"
            iconName="ClipboardCheck"
            iconPosition="left"
            onClick={handleRequestInspection}
            disabled={inspectionRequested || createInspection.isPending}
            className={inspectionRequested ? 'bg-green-600 hover:bg-green-600 text-white' : ''}
          >
            {inspectionRequested
              ? 'Inspección Solicitada'
              : (createInspection.isPending ? 'Solicitando…' : 'Solicitar Inspección')}
          </Button>
        )}
        
        {canViewHistory && (
          <Button
            variant="ghost"
            size="sm"
            iconName="History"
            iconPosition="left"
            onClick={() => onViewHistory && onViewHistory(parcel)}
          >
            Historial
          </Button>
        )}
      </div>
      </div>
    </div>
  );
};

export default ParcelCard;