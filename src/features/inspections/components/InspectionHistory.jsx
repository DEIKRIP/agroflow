import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import StatusBadgeSystem from '../../../components/ui/StatusBadgeSystem';
import Button from '../../../components/ui/Button';

const InspectionHistory = ({ selectedInspection }) => {
  const [expandedHistory, setExpandedHistory] = useState(null);

  const inspectionHistory = [
    {
      id: 1,
      date: new Date('2025-01-20'),
      type: 'initial',
      inspector: 'María González',
      status: 'completed',
      result: 'approved',
      observations: `Inspección inicial completada satisfactoriamente. El suelo presenta condiciones óptimas para el cultivo de maíz con un pH de 6.8. Sistema de riego por goteo funcionando correctamente.\n\nSe observó un excelente manejo de plagas y control de malezas. Documentación completa y al día.`,
      recommendations: 'Continuar con las prácticas actuales de manejo. Monitorear niveles de humedad durante la época seca.',
      photos: [
        'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&h=200&fit=crop',
        'https://images.pexels.com/photos/1595104/pexels-photo-1595104.jpeg?w=300&h=200&fit=crop'
      ],
      checklist: {
        properDocumentation: true,
        adequateStorage: true,
        safetyMeasures: true,
        environmentalCompliance: true,
        qualityStandards: true
      }
    },
    {
      id: 2,
      date: new Date('2024-12-15'),
      type: 'follow_up',
      inspector: 'José Pérez',
      status: 'completed',
      result: 'approved_with_conditions',
      observations: `Seguimiento de inspección previa. Se observaron mejoras en el sistema de almacenamiento según las recomendaciones anteriores.\n\nPresencia leve de plagas en el sector norte de la parcela. Se requiere tratamiento preventivo.`,
      recommendations: 'Aplicar tratamiento preventivo contra plagas en sector norte. Revisar sistema de drenaje en área específica.',
      photos: [
        'https://images.pixabay.com/photo/2016/08/12/22/34/agriculture-1589923_1280.jpg?w=300&h=200&fit=crop'
      ],
      checklist: {
        properDocumentation: true,
        adequateStorage: true,
        safetyMeasures: false,
        environmentalCompliance: true,
        qualityStandards: true
      }
    },
    {
      id: 3,
      date: new Date('2024-11-10'),
      type: 'initial',
      inspector: 'Carmen Silva',
      status: 'completed',
      result: 'rejected',
      observations: `Primera inspección de la parcela. Se encontraron deficiencias significativas en la documentación requerida.\n\nSistema de almacenamiento no cumple con estándares mínimos de seguridad. Falta de equipos de protección personal.`,
      recommendations: 'Completar documentación faltante. Mejorar instalaciones de almacenamiento. Adquirir equipos de protección personal.',
      photos: [],
      checklist: {
        properDocumentation: false,
        adequateStorage: false,
        safetyMeasures: false,
        environmentalCompliance: true,
        qualityStandards: false
      }
    }
  ];

  const getInspectionTypeLabel = (type) => {
    const types = {
      initial: 'Inicial',
      follow_up: 'Seguimiento',
      final: 'Final'
    };
    return types[type] || type;
  };

  const getResultBadge = (result) => {
    const results = {
      approved: { status: 'approved', label: 'Aprobado' },
      approved_with_conditions: { status: 'pending', label: 'Aprobado con Condiciones' },
      rejected: { status: 'rejected', label: 'Rechazado' }
    };
    return results[result] || { status: 'pending', label: result };
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getChecklistScore = (checklist) => {
    const total = Object.keys(checklist).length;
    const passed = Object.values(checklist).filter(Boolean).length;
    return { passed, total, percentage: Math.round((passed / total) * 100) };
  };

  if (!selectedInspection) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <Icon name="History" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Historial de Inspecciones
          </h3>
          <p className="text-muted-foreground">
            Selecciona una inspección para ver su historial
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3 mb-4">
          <Image
            src={selectedInspection.farmer.avatar}
            alt={selectedInspection.farmer.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Historial de Inspecciones
            </h2>
            <p className="text-sm text-muted-foreground">
              {selectedInspection.farmer.name} - {selectedInspection.parcel.id}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {inspectionHistory.length}
            </div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              {inspectionHistory.filter(h => h.result === 'approved').length}
            </div>
            <div className="text-xs text-muted-foreground">Aprobadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-error">
              {inspectionHistory.filter(h => h.result === 'rejected').length}
            </div>
            <div className="text-xs text-muted-foreground">Rechazadas</div>
          </div>
        </div>
      </div>

      {/* History Timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {inspectionHistory.map((history, index) => {
            const isExpanded = expandedHistory === history.id;
            const checklistScore = getChecklistScore(history.checklist);
            const resultBadge = getResultBadge(history.result);

            return (
              <div key={history.id} className="relative">
                {/* Timeline Line */}
                {index < inspectionHistory.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-full bg-border" />
                )}

                <div className="flex space-x-4">
                  {/* Timeline Dot */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full border-4 border-background flex items-center justify-center ${
                    history.result === 'approved' ? 'bg-success' :
                    history.result === 'rejected' ? 'bg-error' : 'bg-warning'
                  }`}>
                    <Icon 
                      name={
                        history.result === 'approved' ? 'CheckCircle' :
                        history.result === 'rejected' ? 'XCircle' : 'AlertCircle'
                      } 
                      size={20} 
                      color="white" 
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-card border border-border rounded-lg p-4 card-elevation">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-foreground">
                            Inspección {getInspectionTypeLabel(history.type)}
                          </h3>
                          <StatusBadgeSystem 
                            status={resultBadge.status} 
                            size="sm" 
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedHistory(isExpanded ? null : history.id)}
                          iconName={isExpanded ? "ChevronUp" : "ChevronDown"}
                          iconPosition="right"
                        >
                          {isExpanded ? 'Menos' : 'Más'}
                        </Button>
                      </div>

                      {/* Basic Info */}
                      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <Icon name="Calendar" size={14} className="text-muted-foreground" />
                          <span className="text-foreground">{formatDate(history.date)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Icon name="User" size={14} className="text-muted-foreground" />
                          <span className="text-foreground">{history.inspector}</span>
                        </div>
                      </div>

                      {/* Checklist Score */}
                      <div className="flex items-center space-x-2 mb-3">
                        <Icon name="CheckSquare" size={14} className="text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          Cumplimiento: {checklistScore.passed}/{checklistScore.total} ({checklistScore.percentage}%)
                        </span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${checklistScore.percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="space-y-4 pt-4 border-t border-border">
                          {/* Observations */}
                          <div>
                            <h4 className="font-medium text-foreground mb-2">Observaciones</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                              {history.observations}
                            </p>
                          </div>

                          {/* Recommendations */}
                          {history.recommendations && (
                            <div>
                              <h4 className="font-medium text-foreground mb-2">Recomendaciones</h4>
                              <p className="text-sm text-muted-foreground">
                                {history.recommendations}
                              </p>
                            </div>
                          )}

                          {/* Checklist Details */}
                          <div>
                            <h4 className="font-medium text-foreground mb-2">Lista de Verificación</h4>
                            <div className="grid grid-cols-1 gap-2">
                              {Object.entries(history.checklist).map(([key, value]) => {
                                const labels = {
                                  properDocumentation: 'Documentación Apropiada',
                                  adequateStorage: 'Almacenamiento Adecuado',
                                  safetyMeasures: 'Medidas de Seguridad',
                                  environmentalCompliance: 'Cumplimiento Ambiental',
                                  qualityStandards: 'Estándares de Calidad'
                                };
                                
                                return (
                                  <div key={key} className="flex items-center space-x-2">
                                    <Icon 
                                      name={value ? "CheckCircle" : "XCircle"} 
                                      size={16} 
                                      className={value ? "text-success" : "text-error"} 
                                    />
                                    <span className="text-sm text-foreground">
                                      {labels[key] || key}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Photos */}
                          {history.photos.length > 0 && (
                            <div>
                              <h4 className="font-medium text-foreground mb-2">Fotografías</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {history.photos.map((photo, photoIndex) => (
                                  <Image
                                    key={photoIndex}
                                    src={photo}
                                    alt={`Foto de inspección ${photoIndex + 1}`}
                                    className="w-full h-20 object-cover rounded-lg"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border">
        <Button
          variant="outline"
          fullWidth
          iconName="Download"
          iconPosition="left"
        >
          Exportar Historial Completo
        </Button>
      </div>
    </div>
  );
};

export default InspectionHistory;