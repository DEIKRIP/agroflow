import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';

const ParcelFilters = ({ onFilterChange, onClearFilters, className = '' }) => {
  const [filters, setFilters] = useState({
    cropType: '',
    soilType: '',
    status: '',
    areaRange: '',
    inspectionStatus: ''
  });

  const cropOptions = [
    { value: '', label: 'Todos los cultivos' },
    { value: 'Maíz', label: 'Maíz' },
    { value: 'Arroz', label: 'Arroz' },
    { value: 'Frijol', label: 'Frijol' },
    { value: 'Yuca', label: 'Yuca' },
    { value: 'Plátano', label: 'Plátano' },
    { value: 'Café', label: 'Café' },
    { value: 'Cacao', label: 'Cacao' },
    { value: 'Tomate', label: 'Tomate' },
    { value: 'Cebolla', label: 'Cebolla' },
    { value: 'Ají', label: 'Ají' }
  ];

  const soilOptions = [
    { value: '', label: 'Todos los suelos' },
    { value: 'Arcilloso', label: 'Arcilloso' },
    { value: 'Arenoso', label: 'Arenoso' },
    { value: 'Franco', label: 'Franco' },
    { value: 'Limoso', label: 'Limoso' },
    { value: 'Orgánico', label: 'Orgánico' }
  ];

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'Activo', label: 'Activo' },
    { value: 'En Preparación', label: 'En Preparación' },
    { value: 'Cosechado', label: 'Cosechado' },
    { value: 'Inactivo', label: 'Inactivo' }
  ];

  const areaOptions = [
    { value: '', label: 'Todas las áreas' },
    { value: '0-1', label: '0 - 1 hectárea' },
    { value: '1-5', label: '1 - 5 hectáreas' },
    { value: '5-10', label: '5 - 10 hectáreas' },
    { value: '10-50', label: '10 - 50 hectáreas' },
    { value: '50+', label: 'Más de 50 hectáreas' }
  ];

  const inspectionOptions = [
    { value: '', label: 'Todas las inspecciones' },
    { value: 'recent', label: 'Inspeccionado (últimos 30 días)' },
    { value: 'pending', label: 'Inspección pendiente' },
    { value: 'overdue', label: 'Inspección vencida' },
    { value: 'never', label: 'Nunca inspeccionado' }
  ];

  const handleFilterChange = (filterKey, value) => {
    const newFilters = {
      ...filters,
      [filterKey]: value
    };
    setFilters(newFilters);
    
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      cropType: '',
      soilType: '',
      status: '',
      areaRange: '',
      inspectionStatus: ''
    };
    setFilters(clearedFilters);
    
    if (onClearFilters) {
      onClearFilters();
    }
    if (onFilterChange) {
      onFilterChange(clearedFilters);
    }
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Icon name="Filter" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Filtros</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            iconName="X"
            iconPosition="left"
            onClick={handleClearFilters}
          >
            Limpiar Filtros
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Select
          label="Cultivo"
          options={cropOptions}
          value={filters.cropType}
          onChange={(value) => handleFilterChange('cropType', value)}
          placeholder="Seleccionar cultivo"
        />

        <Select
          label="Tipo de Suelo"
          options={soilOptions}
          value={filters.soilType}
          onChange={(value) => handleFilterChange('soilType', value)}
          placeholder="Seleccionar suelo"
        />

        <Select
          label="Estado"
          options={statusOptions}
          value={filters.status}
          onChange={(value) => handleFilterChange('status', value)}
          placeholder="Seleccionar estado"
        />

        <Select
          label="Área (hectáreas)"
          options={areaOptions}
          value={filters.areaRange}
          onChange={(value) => handleFilterChange('areaRange', value)}
          placeholder="Seleccionar área"
        />

        <Select
          label="Estado de Inspección"
          options={inspectionOptions}
          value={filters.inspectionStatus}
          onChange={(value) => handleFilterChange('inspectionStatus', value)}
          placeholder="Estado inspección"
        />
      </div>

      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Filtros activos:</span>
            {Object.entries(filters).map(([key, value]) => {
              if (!value) return null;
              
              const labels = {
                cropType: 'Cultivo',
                soilType: 'Suelo',
                status: 'Estado',
                areaRange: 'Área',
                inspectionStatus: 'Inspección'
              };

              return (
                <span
                  key={key}
                  className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                >
                  <span className="font-medium">{labels[key]}:</span>
                  <span className="ml-1">{value}</span>
                  <button
                    onClick={() => handleFilterChange(key, '')}
                    className="ml-1 hover:text-primary/80 micro-interaction"
                  >
                    <Icon name="X" size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParcelFilters;