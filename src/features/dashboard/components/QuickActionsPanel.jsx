import React from 'react';

import Icon from '../../../components/AppIcon';

const QuickActionsPanel = ({ onAction }) => {
  const quickActions = [
    {
      id: 'request-financing',
      title: 'Solicitar Financiamiento',
      description: 'Crear nueva solicitud de crédito agrícola',
      icon: 'DollarSign',
      variant: 'default',
      disabled: false
    },
    {
      id: 'add-parcel',
      title: 'Registrar Parcela',
      description: 'Agregar nueva parcela al sistema',
      icon: 'MapPin',
      variant: 'outline',
      disabled: false
    },
    {
      id: 'view-payments',
      title: 'Ver Pagos',
      description: 'Consultar historial de pagos',
      icon: 'CreditCard',
      variant: 'outline',
      disabled: false
    },
    {
      id: 'schedule-inspection',
      title: 'Programar Inspección',
      description: 'Solicitar inspección de parcela',
      icon: 'ClipboardCheck',
      variant: 'secondary',
      disabled: false
    }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6 card-elevation">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Acciones Rápidas
      </h3>
      
      <div className="space-y-3">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction(action.id)}
            disabled={action.disabled}
            className="w-full p-4 text-left border border-border rounded-lg hover:bg-muted micro-interaction disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name={action.icon} size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground mb-1">
                  {action.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </div>
              <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActionsPanel;