import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import StatusBadgeSystem, { ProgressBadge } from '../../../components/ui/StatusBadgeSystem';

const InspectionForm = ({ inspection, onSave, onSubmit, onApprove, onReject }) => {
  const [formData, setFormData] = useState({
    soilCondition: '',
    soilPh: '',
    moistureLevel: '',
    cropHealth: '',
    pestPresence: '',
    diseasePresence: '',
    weedControl: '',
    irrigationSystem: '',
    complianceChecklist: {
      properDocumentation: false,
      adequateStorage: false,
      safetyMeasures: false,
      environmentalCompliance: false,
      qualityStandards: false
    },
    observations: '',
    recommendations: '',
    photos: [],
    inspectorNotes: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');

  const steps = [
    { id: 1, title: 'Evaluación del Suelo', icon: 'Layers' },
    { id: 2, title: 'Estado del Cultivo', icon: 'Sprout' },
    { id: 3, title: 'Lista de Verificación', icon: 'CheckSquare' },
    { id: 4, title: 'Observaciones y Fotos', icon: 'Camera' }
  ];

  const soilConditionOptions = [
    { value: 'excellent', label: 'Excelente' },
    { value: 'good', label: 'Bueno' },
    { value: 'fair', label: 'Regular' },
    { value: 'poor', label: 'Deficiente' }
  ];

  const cropHealthOptions = [
    { value: 'healthy', label: 'Saludable' },
    { value: 'moderate', label: 'Moderado' },
    { value: 'stressed', label: 'Estresado' },
    { value: 'diseased', label: 'Enfermo' }
  ];

  const presenceOptions = [
    { value: 'none', label: 'Ninguna' },
    { value: 'low', label: 'Baja' },
    { value: 'moderate', label: 'Moderada' },
    { value: 'high', label: 'Alta' }
  ];

  const irrigationOptions = [
    { value: 'drip', label: 'Goteo' },
    { value: 'sprinkler', label: 'Aspersión' },
    { value: 'flood', label: 'Inundación' },
    { value: 'manual', label: 'Manual' },
    { value: 'none', label: 'Sin sistema' }
  ];

  // Auto-save functionality
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      setAutoSaveStatus('saving');
      // Simulate auto-save
      setTimeout(() => {
        setAutoSaveStatus('saved');
        if (onSave) {
          onSave(formData);
        }
      }, 1000);
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [formData, onSave]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setAutoSaveStatus('unsaved');
  };

  const handleChecklistChange = (field, checked) => {
    setFormData(prev => ({
      ...prev,
      complianceChecklist: {
        ...prev.complianceChecklist,
        [field]: checked
      }
    }));
    setAutoSaveStatus('unsaved');
  };

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files);
    const newPhotos = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      url: URL.createObjectURL(file),
      caption: ''
    }));
    
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos]
    }));
  };

  const removePhoto = (photoId) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter(photo => photo.id !== photoId)
    }));
  };

  const getCompletionPercentage = () => {
    const totalFields = 12;
    let completedFields = 0;
    
    if (formData.soilCondition) completedFields++;
    if (formData.soilPh) completedFields++;
    if (formData.moistureLevel) completedFields++;
    if (formData.cropHealth) completedFields++;
    if (formData.pestPresence) completedFields++;
    if (formData.diseasePresence) completedFields++;
    if (formData.weedControl) completedFields++;
    if (formData.irrigationSystem) completedFields++;
    if (formData.observations) completedFields++;
    if (formData.recommendations) completedFields++;
    if (formData.inspectorNotes) completedFields++;
    if (formData.photos.length > 0) completedFields++;
    
    return Math.round((completedFields / totalFields) * 100);
  };

  const isStepComplete = (stepId) => {
    switch (stepId) {
      case 1:
        return formData.soilCondition && formData.soilPh && formData.moistureLevel;
      case 2:
        return formData.cropHealth && formData.pestPresence && formData.diseasePresence;
      case 3:
        return Object.values(formData.complianceChecklist).some(Boolean);
      case 4:
        return formData.observations && formData.photos.length > 0;
      default:
        return false;
    }
  };

  const handleSubmitForReview = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!inspection) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <Icon name="ClipboardList" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Selecciona una Inspección
          </h3>
          <p className="text-muted-foreground">
            Elige una inspección de la cola para comenzar el proceso
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Image
              src={inspection.farmer.avatar}
              alt={inspection.farmer.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {inspection.farmer.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                Parcela {inspection.parcel.id} - {inspection.parcel.crop}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <ProgressBadge current={getCompletionPercentage()} total={100} />
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Icon name="Save" size={14} />
              <span>
                {autoSaveStatus === 'saving' ? 'Guardando...' : 
                 autoSaveStatus === 'saved' ? 'Guardado' : 'Sin guardar'}
              </span>
            </div>
          </div>
        </div>

        {/* Step Navigation */}
        <div className="flex space-x-1 bg-muted rounded-lg p-1">
          {steps.map(step => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-xs font-medium rounded-md micro-interaction ${
                currentStep === step.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name={step.icon} size={14} />
              <span className="hidden sm:inline">{step.title}</span>
              {isStepComplete(step.id) && (
                <Icon name="CheckCircle" size={12} className="text-success" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground mb-4">Evaluación del Suelo</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Condición del Suelo"
                options={soilConditionOptions}
                value={formData.soilCondition}
                onChange={(value) => handleInputChange('soilCondition', value)}
                required
              />
              
              <Input
                label="pH del Suelo"
                type="number"
                min="0"
                max="14"
                step="0.1"
                value={formData.soilPh}
                onChange={(e) => handleInputChange('soilPh', e.target.value)}
                placeholder="6.5"
              />
              
              <Select
                label="Nivel de Humedad"
                options={[
                  { value: 'very_low', label: 'Muy Bajo' },
                  { value: 'low', label: 'Bajo' },
                  { value: 'optimal', label: 'Óptimo' },
                  { value: 'high', label: 'Alto' },
                  { value: 'excessive', label: 'Excesivo' }
                ]}
                value={formData.moistureLevel}
                onChange={(value) => handleInputChange('moistureLevel', value)}
              />
              
              <Select
                label="Sistema de Riego"
                options={irrigationOptions}
                value={formData.irrigationSystem}
                onChange={(value) => handleInputChange('irrigationSystem', value)}
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground mb-4">Estado del Cultivo</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Salud del Cultivo"
                options={cropHealthOptions}
                value={formData.cropHealth}
                onChange={(value) => handleInputChange('cropHealth', value)}
                required
              />
              
              <Select
                label="Presencia de Plagas"
                options={presenceOptions}
                value={formData.pestPresence}
                onChange={(value) => handleInputChange('pestPresence', value)}
              />
              
              <Select
                label="Presencia de Enfermedades"
                options={presenceOptions}
                value={formData.diseasePresence}
                onChange={(value) => handleInputChange('diseasePresence', value)}
              />
              
              <Select
                label="Control de Malezas"
                options={[
                  { value: 'excellent', label: 'Excelente' },
                  { value: 'good', label: 'Bueno' },
                  { value: 'needs_improvement', label: 'Necesita Mejora' },
                  { value: 'poor', label: 'Deficiente' }
                ]}
                value={formData.weedControl}
                onChange={(value) => handleInputChange('weedControl', value)}
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground mb-4">Lista de Verificación de Cumplimiento</h3>
            
            <div className="space-y-3">
              <Checkbox
                label="Documentación Apropiada"
                description="Permisos, licencias y registros al día"
                checked={formData.complianceChecklist.properDocumentation}
                onChange={(e) => handleChecklistChange('properDocumentation', e.target.checked)}
              />
              
              <Checkbox
                label="Almacenamiento Adecuado"
                description="Instalaciones de almacenamiento en buenas condiciones"
                checked={formData.complianceChecklist.adequateStorage}
                onChange={(e) => handleChecklistChange('adequateStorage', e.target.checked)}
              />
              
              <Checkbox
                label="Medidas de Seguridad"
                description="Equipos de protección y procedimientos de seguridad"
                checked={formData.complianceChecklist.safetyMeasures}
                onChange={(e) => handleChecklistChange('safetyMeasures', e.target.checked)}
              />
              
              <Checkbox
                label="Cumplimiento Ambiental"
                description="Prácticas sostenibles y protección ambiental"
                checked={formData.complianceChecklist.environmentalCompliance}
                onChange={(e) => handleChecklistChange('environmentalCompliance', e.target.checked)}
              />
              
              <Checkbox
                label="Estándares de Calidad"
                description="Cumplimiento con estándares de calidad del producto"
                checked={formData.complianceChecklist.qualityStandards}
                onChange={(e) => handleChecklistChange('qualityStandards', e.target.checked)}
              />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground mb-4">Observaciones y Documentación</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Observaciones Generales *
                </label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => handleInputChange('observations', e.target.value)}
                  placeholder="Describe las observaciones generales de la inspección..."
                  className="w-full h-24 px-3 py-2 border border-border rounded-lg bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Recomendaciones
                </label>
                <textarea
                  value={formData.recommendations}
                  onChange={(e) => handleInputChange('recommendations', e.target.value)}
                  placeholder="Proporciona recomendaciones para el agricultor..."
                  className="w-full h-20 px-3 py-2 border border-border rounded-lg bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notas del Inspector
                </label>
                <textarea
                  value={formData.inspectorNotes}
                  onChange={(e) => handleInputChange('inspectorNotes', e.target.value)}
                  placeholder="Notas internas del inspector..."
                  className="w-full h-20 px-3 py-2 border border-border rounded-lg bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                />
              </div>
              
              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Fotografías de la Inspección *
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <Icon name="Camera" size={32} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Haz clic para subir fotografías o arrastra y suelta
                    </p>
                  </label>
                </div>
                
                {/* Photo Preview */}
                {formData.photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    {formData.photos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <Image
                          src={photo.url}
                          alt="Foto de inspección"
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removePhoto(photo.id)}
                          className="absolute top-2 right-2 p-1 bg-error text-error-foreground rounded-full opacity-0 group-hover:opacity-100 micro-interaction"
                        >
                          <Icon name="X" size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-border">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => onSave(formData)}
            iconName="Save"
            iconPosition="left"
            className="flex-1"
          >
            Guardar Borrador
          </Button>
          
          <Button
            variant="default"
            onClick={handleSubmitForReview}
            loading={isSubmitting}
            iconName="Send"
            iconPosition="left"
            className="flex-1"
            disabled={getCompletionPercentage() < 80}
          >
            Enviar para Revisión
          </Button>
          
          <div className="flex space-x-2">
            <Button
              variant="success"
              onClick={() => onApprove(formData)}
              iconName="CheckCircle"
              iconPosition="left"
              size="sm"
            >
              Aprobar
            </Button>
            
            <Button
              variant="destructive"
              onClick={() => onReject(formData)}
              iconName="XCircle"
              iconPosition="left"
              size="sm"
            >
              Rechazar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectionForm;