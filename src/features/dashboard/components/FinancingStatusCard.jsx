import React from 'react';
import Icon from '../../../components/AppIcon';
import StatusBadgeSystem from '../../../components/ui/StatusBadgeSystem';
import Button from '../../../components/ui/Button';

const FinancingStatusCard = ({ financing }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'border-l-warning bg-warning/5';
      case 'approved': return 'border-l-success bg-success/5';
      case 'rejected': return 'border-l-error bg-error/5';
      case 'under_review': return 'border-l-accent bg-accent/5';
      default: return 'border-l-muted bg-muted/5';
    }
  };

  const getActionButton = (status) => {
    switch (status) {
      case 'pending':
        return (
          <Button variant="outline" size="sm" iconName="Eye">
            Ver Detalles
          </Button>
        );
      case 'approved':
        return (
          <Button variant="success" size="sm" iconName="Download">
            Descargar Contrato
          </Button>
        );
      case 'rejected':
        return (
          <Button variant="outline" size="sm" iconName="RefreshCw">
            Nueva Solicitud
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`bg-card border border-border rounded-lg p-6 border-l-4 ${getStatusColor(financing.status)} card-elevation`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Solicitud de Financiamiento
          </h3>
          <div className="flex items-center space-x-2 mb-2">
            <StatusBadgeSystem status={financing.status} />
            <span className="text-sm text-muted-foreground">
              #{financing.id}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">
            Bs. {financing.amount.toLocaleString('es-VE')}
          </p>
          <p className="text-sm text-muted-foreground">
            Monto solicitado
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-muted-foreground">Fecha de Solicitud</p>
          <p className="font-medium text-foreground">
            {financing.requestDate.toLocaleDateString('es-VE')}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Parcela</p>
          <p className="font-medium text-foreground">{financing.parcelName}</p>
        </div>
      </div>

      {financing.observations && (
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Observaciones</p>
          <p className="text-sm text-foreground">{financing.observations}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Icon name="Clock" size={14} />
          <span>Actualizado hace {financing.lastUpdate}</span>
        </div>
        {getActionButton(financing.status)}
      </div>
    </div>
  );
};

export default FinancingStatusCard;