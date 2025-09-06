import React from 'react';
import { Clock, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ActivityTimeline = ({ activities = [] }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  // Default activities if none provided
  const defaultActivities = [
    {
      id: 1,
      type: 'success',
      title: 'Solicitud de financiamiento aprobada',
      description: 'Tu solicitud de financiamiento ha sido aprobada.',
      time: 'Hace 2 horas',
    },
    {
      id: 2,
      type: 'info',
      title: 'Inspección programada',
      description: 'Se ha programado una inspección para el próximo lunes.',
      time: 'Ayer',
    },
    {
      id: 3,
      type: 'warning',
      title: 'Documentación pendiente',
      description: 'Falta cargar el documento de identidad.',
      time: 'Hace 3 días',
    },
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;

  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium">Actividad Reciente</h3>
        <button className="text-sm text-muted-foreground hover:text-foreground">
          Ver todo
        </button>
      </div>
      
      <div className="space-y-6">
        {displayActivities.map((activity) => (
          <div key={activity.id} className="relative pl-6 border-l-2 border-border group">
            <div className="absolute -left-2.5 top-1.5 w-4 h-4 rounded-full bg-background flex items-center justify-center">
              <span className="absolute w-2 h-2 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors"></span>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">{activity.title}</h4>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityTimeline;
