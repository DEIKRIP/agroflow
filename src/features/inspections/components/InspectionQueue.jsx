import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import StatusBadgeSystem, { PriorityBadge } from '../../../components/ui/StatusBadgeSystem';

const InspectionQueue = ({ onSelectInspection, selectedInspectionId }) => {
  const [filter, setFilter] = useState('all'); // all, pending, scheduled, overdue

  const inspections = [
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

  const filteredInspections = inspections.filter(inspection => {
    if (filter === 'all') return true;
    if (filter === 'pending') return inspection.inspection.status === 'pending';
    if (filter === 'scheduled') return inspection.inspection.status === 'scheduled';
    if (filter === 'overdue') return inspection.inspection.status === 'overdue';
    return true;
  });

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
            {filteredInspections.length} inspecciones
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-muted rounded-lg p-1">
          {[
            { key: 'all', label: 'Todas', count: inspections.length },
            { key: 'pending', label: 'Pendientes', count: inspections.filter(i => i.inspection.status === 'pending').length },
            { key: 'scheduled', label: 'Programadas', count: inspections.filter(i => i.inspection.status === 'scheduled').length },
            { key: 'overdue', label: 'Vencidas', count: inspections.filter(i => i.inspection.status === 'overdue').length }
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
        {filteredInspections.length === 0 ? (
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
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${getStatusColor(inspection.inspection.status)} bg-current`} />
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
                      {inspection.parcel.id}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-5">
                    {inspection.parcel.location}
                  </p>
                  <div className="flex items-center space-x-4 mt-1 ml-5">
                    <span className="text-xs text-muted-foreground">
                      {inspection.parcel.area} ha
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {inspection.parcel.crop}
                    </span>
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
                    <span className="text-xs text-muted-foreground">
                      {getInspectionTypeLabel(inspection.inspection.type)}
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