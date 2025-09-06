import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const AddParcelModal = ({ isOpen, onClose, onSave, farmers = [], userRole = 'productor', farmerCedula = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    farmerId: '',
    latitude: '',
    longitude: '',
    area: '',
    soilType: '',
    primaryCrop: '',
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const soilOptions = [
    { value: 'Arcilloso', label: 'Arcilloso - Retiene agua, rico en nutrientes' },
    { value: 'Arenoso', label: 'Arenoso - Buen drenaje, fácil laboreo' },
    { value: 'Franco', label: 'Franco - Equilibrado, ideal para cultivos' },
    { value: 'Limoso', label: 'Limoso - Fértil, retiene humedad' },
    { value: 'Orgánico', label: 'Orgánico - Alto contenido de materia orgánica' }
  ];

  const cropOptions = [
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

  const farmerOptions = farmers.map(farmer => ({
    value: farmer.cedula || farmer.id,
    label: `${farmer.nombre_completo || farmer.name} - ${farmer.cedula}`
  }));

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Validaciones mínimas
      const ced = farmerCedula || formData.farmerId;
      if (!ced && userRole !== 'productor') {
        setErrors(prev => ({ ...prev, farmerId: 'Seleccione un agricultor' }));
        return;
      }

      // Mapear a esquema real de BD
      const payload = {
        farmer_cedula: ced || null,
        ubicacion_lat: formData.latitude ? parseFloat(formData.latitude) : null,
        ubicacion_lng: formData.longitude ? parseFloat(formData.longitude) : null,
        area_hectareas: formData.area ? parseFloat(formData.area) : null,
        tipo_suelo: formData.soilType || null,
        cultivo_principal: formData.primaryCrop || null,
        descripcion: formData.description || null
      };
      await onSave(payload);
      onClose();
    } catch (error) {
      console.error('Error saving parcel:', error);
      setErrors({ submit: 'Error al guardar la parcela' });
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleInputChange('latitude', position.coords.latitude);
          handleInputChange('longitude', position.coords.longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          setErrors(prev => ({
            ...prev,
            location: 'No se pudo obtener la ubicación actual'
          }));
        }
      );
    } else {
      setErrors(prev => ({
        ...prev,
        location: 'La geolocalización no es soportada por este navegador'
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-0">
      <div className="bg-white w-full h-full md:w-full md:max-w-5xl md:h-[90vh] md:max-h-[90vh] md:rounded-lg md:shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon name="MapPin" size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Agregar Nueva Parcela</h2>
              <p className="text-sm text-muted-foreground">Complete la información de la parcela</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg micro-interaction"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Form and Map Container */}
        <div className="flex flex-col md:flex-row overflow-hidden flex-1">
          {/* Form Section */}
          <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6 bg-white flex-1 overflow-y-auto">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Información Básica</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre de la Parcela"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ej: Parcela Norte, Campo Principal"
                  error={errors.name}
                  required
                />
                {(!farmerCedula && userRole !== 'productor') && (
                  <Select
                    label="Agricultor"
                    options={farmerOptions}
                    value={formData.farmerId}
                    onChange={(value) => handleInputChange('farmerId', value)}
                    placeholder="Seleccionar agricultor"
                    error={errors.farmerId}
                    required
                    searchable
                  />
                )}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-foreground">Ubicación</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    iconName="MapPin"
                    iconPosition="left"
                    onClick={() => {
                      if (formData.latitude && formData.longitude) {
                        window.open(`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`, '_blank');
                      }
                    }}
                    disabled={!formData.latitude || !formData.longitude}
                  >
                    Ver en Mapa
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    iconName="Navigation"
                    iconPosition="left"
                    onClick={getCurrentLocation}
                  >
                    Usar Ubicación Actual
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Latitud"
                  type="number"
                  step="0.000001"
                  value={formData.latitude}
                  onChange={(e) => handleInputChange('latitude', e.target.value)}
                  placeholder="Ej: 10.4806"
                  error={errors.latitude}
                />
                <Input
                  label="Longitud"
                  type="number"
                  step="0.000001"
                  value={formData.longitude}
                  onChange={(e) => handleInputChange('longitude', e.target.value)}
                  placeholder="Ej: -66.9036"
                  error={errors.longitude}
                />
              </div>
              
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location}</p>
              )}
              
              {/* Mobile Map Preview */}
              <div className="md:hidden mt-2 bg-card border border-border rounded-lg p-4">
                <div className="aspect-w-16 aspect-h-9 w-full h-48 rounded overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.google.com/maps/embed/v1/view?key=YOUR_GOOGLE_MAPS_API_KEY&center=${formData.latitude || '10.4806'},${formData.longitude || '-66.9036'}&zoom=15`}
                    allowFullScreen
                    title="Ubicación de la parcela"
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  Vista previa de la ubicación de la parcela
                </p>
              </div>
            </div>

            {/* Parcel Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Detalles de la Parcela</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Área (hectáreas)"
                  type="number"
                  step="0.01"
                  value={formData.area}
                  onChange={(e) => handleInputChange('area', e.target.value)}
                  placeholder="Ej: 5.2"
                  error={errors.area}
                />
                <Select
                  label="Tipo de Suelo"
                  options={soilOptions}
                  value={formData.soilType}
                  onChange={(value) => handleInputChange('soilType', value)}
                  placeholder="Seleccionar tipo de suelo"
                  error={errors.soilType}
                />
                <Select
                  label="Cultivo Principal"
                  options={cropOptions}
                  value={formData.primaryCrop}
                  onChange={(value) => handleInputChange('primaryCrop', value)}
                  placeholder="Seleccionar cultivo"
                  error={errors.primaryCrop}
                />
                <Input
                  label="Fecha de Siembra"
                  type="date"
                  value={formData.plantingDate}
                  onChange={(e) => handleInputChange('plantingDate', e.target.value)}
                  error={errors.plantingDate}
                />
              </div>
              
              <Input
                label="Descripción (Opcional)"
                type="text"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Información adicional sobre la parcela"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={isLoading}
                iconName="Save"
                iconPosition="left"
                className="w-full md:w-auto"
              >
                Guardar Parcela
              </Button>
            </div>
          </form>

          {/* Desktop Map Preview */}
          <div className="hidden md:flex flex-col w-full md:w-2/5 border-l border-border">
            <div className="p-4 border-b border-border">
              <h3 className="font-medium text-foreground">Vista Previa del Mapa</h3>
              <p className="text-sm text-muted-foreground">Ubicación de la parcela</p>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0">
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://www.google.com/maps/embed/v1/view?key=YOUR_GOOGLE_MAPS_API_KEY&center=${formData.latitude || '10.4806'},${formData.longitude || '-66.9036'}&zoom=15`}
                  allowFullScreen
                  title="Ubicación de la parcela"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddParcelModal;
