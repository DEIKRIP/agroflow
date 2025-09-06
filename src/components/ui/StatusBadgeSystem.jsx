import React from 'react';
import Icon from '../AppIcon';

const StatusBadgeSystem = ({ 
  status, 
  size = 'default', 
  showIcon = true, 
  className = '',
  animated = false 
}) => {
  const statusConfig = {
    pending: {
      label: 'Pendiente',
      icon: 'Clock',
      className: 'status-pending bg-warning/10 text-warning border-warning/20'
    },
    approved: {
      label: 'Aprobado',
      icon: 'CheckCircle',
      className: 'status-approved bg-success/10 text-success border-success/20'
    },
    rejected: {
      label: 'Rechazado',
      icon: 'XCircle',
      className: 'status-rejected bg-error/10 text-error border-error/20'
    },
    in_progress: {
      label: 'En Proceso',
      icon: 'RefreshCw',
      className: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    completed: {
      label: 'Completado',
      icon: 'Check',
      className: 'status-approved bg-success/10 text-success border-success/20'
    },
    cancelled: {
      label: 'Cancelado',
      icon: 'Ban',
      className: 'bg-gray-100 text-gray-700 border-gray-200'
    },
    under_review: {
      label: 'En Revisión',
      icon: 'Eye',
      className: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    requires_action: {
      label: 'Requiere Acción',
      icon: 'AlertTriangle',
      className: 'status-pending bg-warning/10 text-warning border-warning/20'
    }
  };

  const sizeConfig = {
    sm: {
      className: 'px-2 py-1 text-xs',
      iconSize: 12
    },
    default: {
      className: 'px-2.5 py-1 text-xs',
      iconSize: 14
    },
    lg: {
      className: 'px-3 py-1.5 text-sm',
      iconSize: 16
    }
  };

  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];

  if (!config) {
    return (
      <span className={`inline-flex items-center rounded-full border bg-gray-100 text-gray-700 border-gray-200 ${sizeStyles.className} ${className}`}>
        <span className="font-medium capitalize">{status}</span>
      </span>
    );
  }

  return (
    <span 
      className={`inline-flex items-center rounded-full border font-medium ${config.className} ${sizeStyles.className} ${className} ${
        animated ? 'micro-interaction' : ''
      }`}
    >
      {showIcon && (
        <Icon 
          name={config.icon} 
          size={sizeStyles.iconSize} 
          className={`mr-1 ${animated && status === 'in_progress' ? 'animate-spin' : ''}`}
        />
      )}
      <span>{config.label}</span>
    </span>
  );
};

// Badge with count for navigation items
export const NavigationBadge = ({ count, variant = 'default', className = '' }) => {
  if (!count || count === 0) return null;

  const variants = {
    default: 'bg-accent text-accent-foreground',
    primary: 'bg-primary text-primary-foreground',
    success: 'bg-success text-success-foreground',
    warning: 'bg-warning text-warning-foreground',
    error: 'bg-error text-error-foreground'
  };

  return (
    <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium rounded-full ${variants[variant]} ${className}`}>
      {count > 99 ? '99+' : count}
    </span>
  );
};

// Progress badge for multi-step processes
export const ProgressBadge = ({ current, total, className = '' }) => {
  const percentage = Math.round((current / total) * 100);
  
  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1">
        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {current}/{total}
        </span>
      </div>
    </div>
  );
};

// Priority badge for tasks and items
export const PriorityBadge = ({ priority, className = '' }) => {
  const priorityConfig = {
    low: {
      label: 'Baja',
      className: 'bg-green-100 text-green-700 border-green-200'
    },
    medium: {
      label: 'Media',
      className: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    },
    high: {
      label: 'Alta',
      className: 'bg-orange-100 text-orange-700 border-orange-200'
    },
    urgent: {
      label: 'Urgente',
      className: 'bg-red-100 text-red-700 border-red-200'
    }
  };

  const config = priorityConfig[priority];
  if (!config) return null;

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${config.className} ${className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadgeSystem;