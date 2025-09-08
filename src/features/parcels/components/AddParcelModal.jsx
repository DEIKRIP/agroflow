import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import MapPicker from '../../../components/maps/MapPicker';
import { toast } from 'react-hot-toast';

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
  const [showMap, setShowMap] = useState(false);
  const [geoAccuracy, setGeoAccuracy] = useState(null); // metros

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

      // Advertencia suave si no hay coordenadas, pero no bloquear
      if (!formData.latitude || !formData.longitude) {
        toast('Registrando sin coordenadas. Puede asignarlas luego desde edición.', { icon: 'ℹ️' });
      }

      // Normalizar valores a enums de Supabase (lowercase sin acentos)
      const normalizeEnum = (val) => {
        if (!val) return null;
        const from = 'ÁÉÍÓÚÜÑáéíóúüñ';
        const to   = 'AEIOUUNaeiouun';
        let out = String(val)
          .split('')
          .map(ch => {
            const idx = from.indexOf(ch);
            return idx >= 0 ? to[idx] : ch;
          })
          .join('')
          .toLowerCase();
        // Ajustes específicos de vocabulario
        if (out === 'organico') out = 'humifero';
        return out;
      };

      // Mapear a esquema real de BD
      const payload = {
        nombre: formData.name || null,
        farmer_cedula: ced || null,
        ubicacion_lat: formData.latitude ? parseFloat(formData.latitude) : null,
        ubicacion_lng: formData.longitude ? parseFloat(formData.longitude) : null,
        area_hectareas: formData.area ? parseFloat(formData.area) : null,
        tipo_suelo: normalizeEnum(formData.soilType),
        cultivo_principal: normalizeEnum(formData.primaryCrop),
        fecha_siembra: formData.plantingDate || null,
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
          if (typeof position.coords.accuracy === 'number') {
            setGeoAccuracy(position.coords.accuracy);
          }
          // Al obtener ubicación, abrimos el mapa para visualizar el pin
          setShowMap(true);
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
                    onClick={() => setShowMap((prev) => !prev)}
                  >
                    {showMap ? 'Ocultar Mapa' : 'Ver en Mapa'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    iconName="Navigation"
                    iconPosition="left"
                    onClick={getCurrentLocation}
                  >
                    Mi Ubicación
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Latitud"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => handleInputChange('latitude', e.target.value)}
                  placeholder="Ej: 10.4806"
                  icon="MapPin"
                />
                <Input
                  label="Longitud"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => handleInputChange('longitude', e.target.value)}
                  placeholder="Ej: -66.9036"
                  icon="MapPin"
                />
              </div>
              {showMap && (
                <div className="h-64 md:h-80 rounded-lg overflow-hidden border border-border">
                  <MapPicker
                    value={formData.latitude && formData.longitude 
                      ? { latitude: formData.latitude, longitude: formData.longitude } 
                      : null}
                    onChange={({ latitude, longitude }) => {
                      handleInputChange('latitude', latitude);
                      handleInputChange('longitude', longitude);
                    }}
                    className="h-full w-full"
                    accuracy={geoAccuracy}
                  />
                </div>
              )}

              {errors.location && (
                <p className="text-sm text-red-500">{errors.location}</p>
              )}
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

          {/* Desktop Map Picker */}
          <div className="hidden md:flex flex-col w-full md:w-2/5 border-l border-border">
            <div className="p-4 border-b border-border">
              <h3 className="font-medium text-foreground">Seleccionar en el Mapa</h3>
              <p className="text-sm text-muted-foreground">Haga clic o arrastre el marcador para definir la ubicación</p>
            </div>
            <div className="flex-1">
              <MapPicker
                value={formData.latitude && formData.longitude ? { latitude: parseFloat(formData.latitude), longitude: parseFloat(formData.longitude) } : null}
                onChange={(coords) => {
                  if (!coords) return;
                  handleInputChange('latitude', coords.latitude);
                  handleInputChange('longitude', coords.longitude);
                }}
                height="100%"
                zoom={formData.latitude && formData.longitude ? 15 : 10}
                accuracy={geoAccuracy}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddParcelModal;
